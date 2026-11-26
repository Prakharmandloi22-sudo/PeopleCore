import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

/**
 * RBAC Authorization Middleware (Assessment 04)
 * Enforces role-based permissions and least privilege access
 */
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User context not found.' }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
        }
      });
      return;
    }

    next();
  };
};

/**
 * Resource-level authorization: Allows access if the user has an admin/HR role OR is accessing their own record.
 */
export const authorizeSelfOrRoles = (getTargetEmployeeId: (req: Request) => string | undefined, ...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User context not found.' }
      });
      return;
    }

    const targetEmployeeId = getTargetEmployeeId(req);
    const isOwner = req.user.employeeId && targetEmployeeId === req.user.employeeId;
    const hasRole = allowedRoles.includes(req.user.role);

    if (!isOwner && !hasRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You do not have permission to view or modify this employee record.'
        }
      });
      return;
    }

    next();
  };
};
