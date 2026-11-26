import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma, config, logger } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { createAuditRecord } from '../../middleware/audit.middleware';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * POST /api/v1/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          departmentId: true,
          designationId: true,
        }
      }
    }
  });

  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
    });
    return;
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employee?.id,
  };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });

  const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });

  // Audit login
  await createAuditRecord({
    actorId: user.id,
    actorRole: user.role,
    action: 'USER_LOGIN',
    entityName: 'User',
    entityId: user.id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'unknown',
  });

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee,
      }
    }
  });
});

/**
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Refresh token is required.' }
    });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { employee: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User is inactive or not found.' }
      });
      return;
    }

    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.id,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );

    res.json({
      success: true,
      data: { accessToken: newAccessToken }
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token.' }
    });
  }
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      employee: {
        include: {
          department: true,
          designation: true,
        }
      }
    }
  });

  res.json({
    success: true,
    data: { user }
  });
});

export default router;
