import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { LeaveStatus, Role } from '@prisma/client';
import { EmailService } from '../../services/email.service';
import { createAuditRecord } from '../../middleware/audit.middleware';

const router = Router();

const leaveRequestSchema = z.object({
  leaveTypeId: z.string(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  totalDays: z.number().positive(),
  isHalfDay: z.boolean().default(false),
  reason: z.string().min(5),
});

/**
 * Assessment 07: Attendance and Leave Engine
 * - Handles overlapping leave detection transactionally
 * - Decrements leave balances accurately
 * - Dispatches transactional email & iCalendar .ics file upon approval
 */

// GET /api/v1/leaves/types
router.get('/types', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const types = await prisma.leaveType.findMany({
    orderBy: { name: 'asc' }
  });
  res.json({ success: true, data: { leaveTypes: types } });
});

// GET /api/v1/leaves/balances
router.get('/balances', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({ success: false, error: { code: 'NO_EMPLOYEE', message: 'Employee profile not found.' } });
    return;
  }

  const currentYear = new Date().getFullYear();
  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId, year: currentYear },
    include: { leaveType: true }
  });

  res.json({ success: true, data: { balances } });
});

// POST /api/v1/leaves/request
router.post('/request', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({ success: false, error: { code: 'NO_EMPLOYEE', message: 'Employee profile not found.' } });
    return;
  }

  const data = leaveRequestSchema.parse(req.body);

  if (data.endDate < data.startDate) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_DATE_RANGE', message: 'End date cannot be prior to start date.' }
    });
    return;
  }

  // Transactional overlap check and balance reservation
  const result = await prisma.$transaction(async (tx) => {
    // 1. Check for overlapping approved or pending requests
    const overlapping = await tx.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
          }
        ]
      }
    });

    if (overlapping) {
      throw new Error('OVERLAPPING_LEAVE: You already have a pending or approved leave request during this date range.');
    }

    // 2. Check balance
    const currentYear = data.startDate.getFullYear();
    const balance = await tx.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: data.leaveTypeId,
          year: currentYear
        }
      }
    });

    if (balance) {
      const remaining = Number(balance.allocatedDays) + Number(balance.carriedOverDays) - Number(balance.usedDays) - Number(balance.pendingDays);
      if (data.totalDays > remaining) {
        throw new Error(`INSUFFICIENT_BALANCE: Requested ${data.totalDays} days, but only ${remaining} days available.`);
      }

      // Increment pending days
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { increment: data.totalDays } }
      });
    }

    // 3. Create leave request
    const request = await tx.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        isHalfDay: data.isHalfDay,
        reason: data.reason,
        status: LeaveStatus.PENDING,
      },
      include: { leaveType: true, employee: true }
    });

    return request;
  }).catch((err: any) => {
    return { error: err.message };
  });

  if ('error' in result) {
    const [code, msg] = result.error.includes(':') ? result.error.split(': ') : ['BAD_REQUEST', result.error];
    res.status(400).json({ success: false, error: { code, message: msg } });
    return;
  }

  res.status(201).json({
    success: true,
    data: { leaveRequest: result }
  });
});

// GET /api/v1/leaves/my-requests
router.get('/my-requests', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({ success: false, error: { code: 'NO_EMPLOYEE', message: 'Employee profile not found.' } });
    return;
  }

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId },
    include: { leaveType: true },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: { leaveRequests: requests } });
});

// GET /api/v1/leaves/pending - Pending leaves for review (Manager/HR)
router.get(
  '/pending',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    const where: any = { status: LeaveStatus.PENDING };

    // If manager, only their direct reports
    if (req.user?.role === Role.MANAGER && req.user.employeeId) {
      where.employee = { managerId: req.user.employeeId };
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true } },
        leaveType: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ success: true, data: { leaveRequests: requests } });
  }
);

// PUT /api/v1/leaves/:id/status - Approve or reject
router.put(
  '/:id/status',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    const { status, rejectionReason } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be APPROVED or REJECTED' } });
      return;
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
      include: { employee: { include: { user: true } }, leaveType: true }
    });

    if (!leave) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Leave request not found.' } });
      return;
    }

    if (leave.status !== LeaveStatus.PENDING) {
      res.status(400).json({ success: false, error: { code: 'ALREADY_DECIDED', message: `Leave is already ${leave.status}` } });
      return;
    }

    const year = leave.startDate.getFullYear();

    const updated = await prisma.$transaction(async (tx) => {
      // Release pending days from balance
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leave.employeeId,
            leaveTypeId: leave.leaveTypeId,
            year
          }
        }
      });

      if (balance) {
        if (status === 'APPROVED') {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              pendingDays: { decrement: leave.totalDays },
              usedDays: { increment: leave.totalDays }
            }
          });
        } else {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              pendingDays: { decrement: leave.totalDays }
            }
          });
        }
      }

      return tx.leaveRequest.update({
        where: { id: leave.id },
        data: {
          status: status as LeaveStatus,
          approvedBy: req.user!.id,
          reviewedAt: new Date(),
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        },
        include: { employee: true, leaveType: true }
      });
    });

    // Send transactional notification email and .ics file on approval (Assessment 08)
    if (status === 'APPROVED' && leave.employee.user?.email) {
      await EmailService.sendLeaveApprovalNotification(leave.employee.user.email, {
        employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
        leaveType: leave.leaveType.name,
        startDate: leave.startDate,
        endDate: leave.endDate,
        approverName: req.user.email,
      });
    }

    await createAuditRecord({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: status === 'APPROVED' ? 'LEAVE_APPROVAL' : 'LEAVE_REJECTION',
      entityName: 'LeaveRequest',
      entityId: updated.id,
      newValues: { status, approver: req.user.email },
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      data: { leaveRequest: updated }
    });
  }
);

export default router;
