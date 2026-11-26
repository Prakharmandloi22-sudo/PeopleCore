import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { sanitizeEmployeeRecord, sanitizeEmployeeList } from '../../middleware/salaryMask.middleware';
import { createAuditRecord } from '../../middleware/audit.middleware';
import { Role, EmploymentType, EmploymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();

const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).default('Employee@123456'),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  employeeNumber: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().transform(str => new Date(str)),
  gender: z.string(),
  phone: z.string(),
  address: z.string().optional(),
  departmentId: z.string(),
  designationId: z.string(),
  managerId: z.string().optional(),
  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
  employmentStatus: z.nativeEnum(EmploymentStatus).default(EmploymentStatus.ACTIVE),
  hireDate: z.string().transform(str => new Date(str)),
  baseSalary: z.number().positive(),
  currency: z.string().default('USD'),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankRoutingNumber: z.string().optional(),
});

/**
 * GET /api/v1/employees - List employees with filters and salary masking
 */
router.get('/', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const { departmentId, search, status, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
  const take = parseInt(limit as string, 10);

  const whereClause: any = {};
  if (departmentId) whereClause.departmentId = departmentId as string;
  if (status) whereClause.employmentStatus = status as EmploymentStatus;
  if (search) {
    whereClause.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { employeeNumber: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [total, rawEmployees] = await Promise.all([
    prisma.employee.count({ where: whereClause }),
    prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
        designation: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true }
        },
        user: { select: { email: true, role: true, isActive: true } }
      },
      skip,
      take,
      orderBy: { employeeNumber: 'asc' }
    })
  ]);

  // Mask salary & banking fields based on current user's role
  const employees = sanitizeEmployeeList(rawEmployees, req.user);

  res.json({
    success: true,
    data: {
      employees,
      pagination: {
        total,
        page: parseInt(page as string, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    }
  });
});

/**
 * GET /api/v1/employees/:id - Get employee details
 */
router.get('/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const employee = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: {
      department: true,
      designation: true,
      manager: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
      directReports: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
      shifts: { include: { shift: true } },
      leaveBalances: { include: { leaveType: true } },
      salaryComponents: { include: { component: true } },
      user: { select: { email: true, role: true, isActive: true, lastLoginAt: true } }
    }
  });

  if (!employee) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Employee not found.' }
    });
    return;
  }

  // Audit view if requesting salary or confidential profile
  if (req.user?.role === Role.PAYROLL_SPECIALIST || req.user?.role === Role.ADMINISTRATOR) {
    await createAuditRecord({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'SALARY_VIEW',
      entityName: 'Employee',
      entityId: employee.id,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });
  }

  const sanitized = sanitizeEmployeeRecord(employee, req.user);

  res.json({
    success: true,
    data: { employee: sanitized }
  });
});

/**
 * POST /api/v1/employees - Onboard a new employee (HR / Admin only)
 */
router.post(
  '/',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER),
  async (req: Request, res: Response): Promise<void> => {
    const data = createEmployeeSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'A user with this email address already exists.' }
      });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role,
        }
      });

      const employee = await tx.employee.create({
        data: {
          employeeNumber: data.employeeNumber,
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          phone: data.phone,
          address: data.address,
          departmentId: data.departmentId,
          designationId: data.designationId,
          managerId: data.managerId,
          employmentType: data.employmentType,
          employmentStatus: data.employmentStatus,
          hireDate: data.hireDate,
          baseSalary: data.baseSalary,
          currency: data.currency,
          bankName: data.bankName,
          bankAccountNumber: data.bankAccountNumber,
          bankRoutingNumber: data.bankRoutingNumber,
        },
        include: {
          department: true,
          designation: true,
        }
      });

      // Allocate initial default leave balances for current year
      const leaveTypes = await tx.leaveType.findMany();
      const currentYear = new Date().getFullYear();
      for (const lt of leaveTypes) {
        await tx.leaveBalance.create({
          data: {
            employeeId: employee.id,
            leaveTypeId: lt.id,
            year: currentYear,
            allocatedDays: lt.annualAllowance,
            usedDays: 0,
            pendingDays: 0,
            carriedOverDays: 0
          }
        });
      }

      return employee;
    });

    await createAuditRecord({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'EMPLOYEE_ONBOARD',
      entityName: 'Employee',
      entityId: result.id,
      newValues: { employeeNumber: result.employeeNumber, name: `${result.firstName} ${result.lastName}` },
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: { employee: result }
    });
  }
);

/**
 * PUT /api/v1/employees/:id - Update employee record (HR / Admin only)
 */
router.put(
  '/:id',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER),
  async (req: Request, res: Response): Promise<void> => {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employee not found.' }
      });
      return;
    }

    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data: req.body,
      include: { department: true, designation: true }
    });

    await createAuditRecord({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'EMPLOYEE_UPDATE',
      entityName: 'Employee',
      entityId: updated.id,
      oldValues: { ...existing },
      newValues: { ...updated },
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      data: { employee: sanitizeEmployeeRecord(updated, req.user) }
    });
  }
);

/**
 * DELETE /api/v1/employees/:id - Offboard employee / mark TERMINATED
 */
router.delete(
  '/:id',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER),
  async (req: Request, res: Response): Promise<void> => {
    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        employmentStatus: EmploymentStatus.TERMINATED,
        terminationDate: new Date(),
      }
    });

    await createAuditRecord({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'EMPLOYEE_OFFBOARD',
      entityName: 'Employee',
      entityId: updated.id,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Employee offboarded successfully.'
    });
  }
);

export default router;
