import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

const shiftSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(3),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
  isOvernight: z.boolean().default(false),
  gracePeriodMinutes: z.number().int().min(0).default(15),
  workHoursPerDay: z.number().positive().default(8.0),
  colorCode: z.string().default('#3B82F6'),
});

const assignShiftSchema = z.object({
  employeeId: z.string(),
  shiftId: z.string(),
  effectiveFrom: z.string().transform(str => new Date(str)),
  effectiveTo: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

/**
 * GET /api/v1/shifts - List available shifts
 */
router.get('/', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const shifts = await prisma.shift.findMany({
    include: { _count: { select: { employeeShifts: true } } },
    orderBy: { startTime: 'asc' }
  });

  res.json({
    success: true,
    data: { shifts }
  });
});

/**
 * POST /api/v1/shifts - Create shift template (Admin / HR)
 */
router.post(
  '/',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER),
  async (req: Request, res: Response): Promise<void> => {
    const data = shiftSchema.parse(req.body);

    const shift = await prisma.shift.create({ data });

    res.status(201).json({
      success: true,
      data: { shift }
    });
  }
);

/**
 * POST /api/v1/shifts/assign - Assign shift to an employee
 */
router.post(
  '/assign',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    const data = assignShiftSchema.parse(req.body);

    const assignment = await prisma.employeeShift.create({
      data,
      include: { shift: true, employee: true }
    });

    res.status(201).json({
      success: true,
      data: { assignment }
    });
  }
);

export default router;
