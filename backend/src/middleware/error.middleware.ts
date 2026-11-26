import { Request, Response, NextFunction } from 'express';
import { logger } from '../config';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Structured error logging without leaking raw sensitive tokens
  logger.error(`${req.method} ${req.url} - Error: ${err.message}`, {
    stack: err.stack,
    body: req.body ? Object.keys(req.body) : undefined,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input parameters.',
        details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      }
    });
    return;
  }

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    const fields = (err.meta?.target as string[]) || [];
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: `A record with this ${fields.join(', ')} already exists.`
      }
    });
    return;
  }

  // Prisma not found error
  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Requested record was not found.'
      }
    });
    return;
  }

  const statusCode = err.statusCode || (err.status >= 400 && err.status < 600 ? err.status : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 && isProduction
        ? 'An unexpected error occurred. Please contact the administrator.'
        : err.message
    }
  });
}
