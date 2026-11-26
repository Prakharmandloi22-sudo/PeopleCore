import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { Role } from '@prisma/client';
import { createAuditRecord } from '../../middleware/audit.middleware';

const router = Router();

const reviewSchema = z.object({
  employeeId: z.string(),
  reviewPeriod: z.string().min(3),
  reviewDate: z.string().transform(str => new Date(str)),
  overallRating: z.number().int().min(1).max(5),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  goals: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'COMPLETED']).default('SUBMITTED'),
});

/**
 * GET /api/v1/performance/reviews - List all reviews (HR / Managers)
 */
router.get(
  '/reviews',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    const where: any = {};
    if (req.user?.role === Role.MANAGER && req.user.employeeId) {
      where.OR = [
        { reviewerId: req.user.employeeId },
        { employee: { managerId: req.user.employeeId } }
      ];
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } }
      },
      orderBy: { reviewDate: 'desc' }
    });

    res.json({ success: true, data: { reviews } });
  }
);

/**
 * POST /api/v1/performance/reviews - Submit review
 */
router.post(
  '/reviews',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    const reviewerId = req.user?.employeeId;
    if (!reviewerId) {
      res.status(400).json({ success: false, error: { code: 'NO_EMPLOYEE', message: 'Reviewer must have an employee profile.' } });
      return;
    }

    const data = reviewSchema.parse(req.body);

    const review = await prisma.performanceReview.create({
      data: {
        ...data,
        reviewerId,
      },
      include: {
        employee: true,
        reviewer: true,
      }
    });

    await createAuditRecord({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'PERFORMANCE_REVIEW_SUBMIT',
      entityName: 'PerformanceReview',
      entityId: review.id,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({ success: true, data: { review } });
  }
);

/**
 * GET /api/v1/performance/my-reviews - Self-service performance view
 */
router.get('/my-reviews', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({ success: false, error: { code: 'NO_EMPLOYEE', message: 'Employee profile not found.' } });
    return;
  }

  const reviews = await prisma.performanceReview.findMany({
    where: { employeeId },
    include: {
      reviewer: { select: { firstName: true, lastName: true } }
    },
    orderBy: { reviewDate: 'desc' }
  });

  res.json({ success: true, data: { reviews } });
});

export default router;
