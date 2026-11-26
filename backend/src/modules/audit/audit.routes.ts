import { Router, Request, Response } from 'express';
import { prisma } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/v1/audit-logs - View system audit trail (Administrator only)
 */
router.get(
  '/',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR),
  async (req: Request, res: Response): Promise<void> => {
    const { action, entityName, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);

    const where: any = {};
    if (action) where.action = action as string;
    if (entityName) where.entityName = entityName as string;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, email: true, role: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take
      })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page as string, 10),
          limit: take,
          totalPages: Math.ceil(total / take)
        }
      }
    });
  }
);

export default router;
