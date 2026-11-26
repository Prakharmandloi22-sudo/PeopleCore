import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config, logger, prisma } from './config';
import { errorHandler } from './middleware/error.middleware';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import employeeRoutes from './modules/employees/employee.routes';
import departmentRoutes from './modules/departments/department.routes';
import shiftRoutes from './modules/shifts/shift.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import leaveRoutes from './modules/leave/leave.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import performanceRoutes from './modules/performance/performance.routes';
import documentRoutes from './modules/documents/document.routes';
import auditRoutes from './modules/audit/audit.routes';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Correlation / Request ID Middleware
app.use((req, res, next) => {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
});

// Serve local upload storage securely
app.use('/uploads', express.static(path.resolve(config.storage.localDir)));

// System Health and Readiness probes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'peoplecore-core-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

app.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected' });
  } catch (err: any) {
    res.status(503).json({ status: 'unready', database: 'disconnected', error: err.message });
  }
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

// Centralized error handler
app.use(errorHandler);
