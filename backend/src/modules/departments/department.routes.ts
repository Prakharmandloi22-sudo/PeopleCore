import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

const departmentSchema = z.object({
  code: z.string().min(2).max(10).toUpperCase(),
  name: z.string().min(2),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

/**
 * GET /api/v1/departments - List all departments with designations and staff counts
 */
router.get('/', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const departments = await prisma.department.findMany({
    include: {
      designations: true,
      _count: { select: { employees: true } }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: { departments }
  });
});

/**
 * POST /api/v1/departments - Create department (Admin / HR)
 */
router.post(
  '/',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER),
  async (req: Request, res: Response): Promise<void> => {
    const data = departmentSchema.parse(req.body);

    const department = await prisma.department.create({
      data,
      include: { designations: true }
    });

    res.status(201).json({
      success: true,
      data: { department }
    });
  }
);

/**
 * GET /api/v1/departments/designations - List all job designations
 */
router.get('/designations', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const designations = await prisma.designation.findMany({
    include: { department: true },
    orderBy: { title: 'asc' }
  });

  res.json({
    success: true,
    data: { designations }
  });
});

export default router;
