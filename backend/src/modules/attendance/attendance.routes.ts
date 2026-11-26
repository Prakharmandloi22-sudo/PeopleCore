import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { AttendanceStatus, CorrectionStatus, Role } from '@prisma/client';
import { createAuditRecord } from '../../middleware/audit.middleware';

const router = Router();

/**
 * Assessment 07 Attendance Engine:
 * Robust shift evaluation, grace periods, overnight shift calculations across midnight,
 * and overtime computations.
 */

// POST /api/v1/attendance/check-in
router.post('/check-in', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_EMPLOYEE_PROFILE', message: 'User is not linked to an employee profile.' }
    });
    return;
  }

  const now = new Date();
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Find existing record for today
  let record = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: todayDateOnly,
      }
    }
  });

  if (record && record.checkInTime) {
    res.status(409).json({
      success: false,
      error: { code: 'ALREADY_CHECKED_IN', message: 'You have already checked in for today.' }
    });
    return;
  }

  // Find active assigned shift
  const shiftAssignment = await prisma.employeeShift.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }]
    },
    include: { shift: true },
    orderBy: { effectiveFrom: 'desc' }
  });

  const shift = shiftAssignment?.shift;
  let status: AttendanceStatus = AttendanceStatus.PRESENT;

  if (shift) {
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const scheduledStart = new Date(todayDateOnly);
    scheduledStart.setHours(startHour, startMin, 0, 0);

    const graceLimit = new Date(scheduledStart.getTime() + shift.gracePeriodMinutes * 60 * 1000);
    if (now > graceLimit) {
      status = AttendanceStatus.LATE;
    }
  }

  record = await prisma.attendanceRecord.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: todayDateOnly,
      }
    },
    update: {
      checkInTime: now,
      status,
      shiftId: shift?.id,
      notes: req.body.notes || null,
    },
    create: {
      employeeId,
      shiftId: shift?.id,
      date: todayDateOnly,
      checkInTime: now,
      status,
      notes: req.body.notes || null,
    }
  });

  res.json({
    success: true,
    data: { attendance: record }
  });
});

// POST /api/v1/attendance/check-out
router.post('/check-out', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_EMPLOYEE_PROFILE', message: 'User is not linked to an employee profile.' }
    });
    return;
  }

  const now = new Date();
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  // Check today's record first; if not found or checked-in yesterday for an overnight shift, check yesterday's record
  let record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: todayDateOnly } },
    include: { shift: true }
  });

  // If no check-in today, check if active overnight check-in occurred yesterday
  if (!record || !record.checkInTime) {
    const yesterdayRecord = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: yesterdayDateOnly } },
      include: { shift: true }
    });

    if (yesterdayRecord && yesterdayRecord.checkInTime && !yesterdayRecord.checkOutTime && yesterdayRecord.shift?.isOvernight) {
      record = yesterdayRecord;
    }
  }

  if (!record || !record.checkInTime) {
    res.status(400).json({
      success: false,
      error: { code: 'NOT_CHECKED_IN', message: 'No active check-in record found to check out from.' }
    });
    return;
  }

  const checkInTime = new Date(record.checkInTime);
  const diffMillis = now.getTime() - checkInTime.getTime();
  const totalHours = Math.max(0, Math.round((diffMillis / (1000 * 60 * 60)) * 100) / 100);

  const standardWorkHours = record.shift ? Number(record.shift.workHoursPerDay) : 8.0;
  const regularHours = Math.min(totalHours, standardWorkHours);
  const overtimeHours = Math.max(0, Math.round((totalHours - regularHours) * 100) / 100);

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOutTime: now,
      totalWorkHours: totalHours,
      regularHours,
      overtimeHours,
    }
  });

  res.json({
    success: true,
    data: { attendance: updated }
  });
});

// GET /api/v1/attendance/my-history
router.get('/my-history', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({ success: false, error: { code: 'NO_EMPLOYEE', message: 'Not linked to employee.' } });
    return;
  }

  const history = await prisma.attendanceRecord.findMany({
    where: { employeeId },
    include: { shift: true, corrections: true },
    orderBy: { date: 'desc' },
    take: 60,
  });

  res.json({
    success: true,
    data: { history }
  });
});

// GET /api/v1/attendance/records - HR / Manager query
router.get('/records', authenticateJwt, authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER), async (req: Request, res: Response): Promise<void> => {
  const { departmentId, dateFrom, dateTo } = req.query;

  const where: any = {};
  if (departmentId) {
    where.employee = { departmentId: departmentId as string };
  }
  if (dateFrom && dateTo) {
    where.date = {
      gte: new Date(dateFrom as string),
      lte: new Date(dateTo as string),
    };
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true }
      },
      shift: true,
      corrections: true
    },
    orderBy: { date: 'desc' },
    take: 100
  });

  res.json({
    success: true,
    data: { records }
  });
});

// POST /api/v1/attendance/correction - Request correction
router.post('/correction', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    attendanceRecordId: z.string(),
    correctedCheckIn: z.string().transform(str => new Date(str)),
    correctedCheckOut: z.string().transform(str => new Date(str)),
    reason: z.string().min(5),
  });

  const data = schema.parse(req.body);

  const correction = await prisma.attendanceCorrection.create({
    data: {
      ...data,
      requestedBy: req.user!.id,
      status: CorrectionStatus.PENDING,
    }
  });

  res.status(201).json({
    success: true,
    data: { correction }
  });
});

// PUT /api/v1/attendance/correction/:id/status - Approve/Reject correction
router.put(
  '/correction/:id/status',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be APPROVED or REJECTED' } });
      return;
    }

    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id: req.params.id },
      include: { attendanceRecord: { include: { shift: true } } }
    });

    if (!correction) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Correction not found.' } });
      return;
    }

    const updatedCorrection = await prisma.$transaction(async (tx) => {
      const corr = await tx.attendanceCorrection.update({
        where: { id: correction.id },
        data: {
          status: status as CorrectionStatus,
          approvedBy: req.user!.id,
          reviewedAt: new Date(),
        }
      });

      if (status === 'APPROVED') {
        const diffMillis = correction.correctedCheckOut.getTime() - correction.correctedCheckIn.getTime();
        const totalHours = Math.max(0, Math.round((diffMillis / (1000 * 60 * 60)) * 100) / 100);
        const standardHours = correction.attendanceRecord.shift ? Number(correction.attendanceRecord.shift.workHoursPerDay) : 8.0;
        const regularHours = Math.min(totalHours, standardHours);
        const overtimeHours = Math.max(0, Math.round((totalHours - regularHours) * 100) / 100);

        await tx.attendanceRecord.update({
          where: { id: correction.attendanceRecordId },
          data: {
            checkInTime: correction.correctedCheckIn,
            checkOutTime: correction.correctedCheckOut,
            totalWorkHours: totalHours,
            regularHours,
            overtimeHours,
            isCorrected: true,
            status: AttendanceStatus.PRESENT
          }
        });
      }

      return corr;
    });

    res.json({
      success: true,
      data: { correction: updatedCorrection }
    });
  }
);

export default router;
