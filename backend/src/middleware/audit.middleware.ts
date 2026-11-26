import { Request, Response, NextFunction } from 'express';
import { prisma, logger } from '../config';
import { Role } from '@prisma/client';

export interface AuditLogOptions {
  action: string;
  entityName: string;
  getEntityId?: (req: Request) => string | undefined;
}

/**
 * Creates an audit log entry in the PostgreSQL database for sensitive actions (Assessment 04)
 */
export async function createAuditRecord(params: {
  actorId: string;
  actorRole: Role;
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        entityName: params.entityName,
        entityId: params.entityId,
        oldValues: params.oldValues || undefined,
        newValues: params.newValues || undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      }
    });
  } catch (error) {
    logger.error('Failed to write audit log record:', error);
  }
}

/**
 * Audit Middleware helper to automatically log route execution on success
 */
export const logAuditAction = (options: AuditLogOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Intercept response finish
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = options.getEntityId ? options.getEntityId(req) : req.params.id;
        const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'unknown';

        await createAuditRecord({
          actorId: req.user.id,
          actorRole: req.user.role,
          action: options.action,
          entityName: options.entityName,
          entityId,
          newValues: req.method !== 'GET' ? req.body : undefined,
          ipAddress,
          userAgent,
        });
      }
    });

    next();
  };
};
