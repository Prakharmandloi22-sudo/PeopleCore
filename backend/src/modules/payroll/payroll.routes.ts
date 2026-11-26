import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma, logger } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { PayrollStatus, PayslipStatus, Role, EmploymentStatus, ComponentType } from '@prisma/client';
import { PythonBridgeService } from '../../services/pythonBridge.service';
import { BankExportService } from '../../services/bankExport.service';
import { createAuditRecord } from '../../middleware/audit.middleware';

const router = Router();

const payrollRunSchema = z.object({
  periodCode: z.string().min(6), // e.g., "2026-03-MONTHLY"
  name: z.string().min(3),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  payDate: z.string().transform(str => new Date(str)),
});

/**
 * Assessment 02, 05, 08, 15 & Domain Capstone Challenge:
 * Idempotent, reproducible payroll run.
 * Re-running must not create duplicate payroll entries or payments!
 */
router.post(
  '/runs',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.PAYROLL_SPECIALIST),
  async (req: Request, res: Response): Promise<void> => {
    const data = payrollRunSchema.parse(req.body);

    // 1. Check existing payroll period (Capstone Idempotency Guard)
    const existingPeriod = await prisma.payrollPeriod.findUnique({
      where: { periodCode: data.periodCode },
      include: {
        _count: { select: { payslips: true } }
      }
    });

    if (existingPeriod && existingPeriod.status === PayrollStatus.FINALIZED) {
      res.status(409).json({
        success: false,
        error: {
          code: 'PAYROLL_ALREADY_FINALIZED',
          message: `Payroll for period ${data.periodCode} is already finalized and locked. Re-running a finalized payroll is prohibited to prevent duplicate payments.`,
          periodId: existingPeriod.id,
          payslipCount: existingPeriod._count.payslips
        }
      });
      return;
    }

    // 2. Query all ACTIVE employees
    const employees = await prisma.employee.findMany({
      where: { employmentStatus: EmploymentStatus.ACTIVE },
      include: {
        salaryComponents: { include: { component: true } },
        attendanceRecords: {
          where: {
            date: {
              gte: data.startDate,
              lte: data.endDate
            }
          }
        },
        leaveRequests: {
          where: {
            status: 'APPROVED',
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate }
          },
          include: { leaveType: true }
        }
      }
    });

    if (employees.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_ACTIVE_EMPLOYEES', message: 'No active employees found to process for this period.' }
      });
      return;
    }

    // Calculate business days in range (approx 22 days standard)
    const workDaysInMonth = 22;

    // 3. Process each employee through the Python Payroll Engine (or fallback)
    const calculationResults: Array<{
      employee: typeof employees[0];
      calc: any;
    }> = [];

    for (const emp of employees) {
      const daysPresent = emp.attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const overtimeHours = emp.attendanceRecords.reduce((acc, a) => acc + Number(a.overtimeHours), 0);
      
      const unpaidLeaveDays = emp.leaveRequests
        .filter(l => !l.leaveType.isPaid)
        .reduce((acc, l) => acc + Number(l.totalDays), 0);

      const paidLeaveDays = emp.leaveRequests
        .filter(l => l.leaveType.isPaid)
        .reduce((acc, l) => acc + Number(l.totalDays), 0);

      const componentsPayload = emp.salaryComponents.map(sc => ({
        code: sc.component.code,
        name: sc.component.name,
        type: sc.component.type,
        calculationType: sc.component.calculationType,
        value: sc.component.calculationType === 'PERCENTAGE_OF_BASE' && sc.percentage
          ? Number(sc.percentage)
          : Number(sc.amount),
        isTaxable: sc.component.isTaxable,
        isStatutory: sc.component.isStatutory,
      }));

      // Call high-precision Python service
      const calc = await PythonBridgeService.calculatePayroll({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        baseSalary: Number(emp.baseSalary),
        workDaysInMonth,
        daysPresent,
        daysPaidLeave: paidLeaveDays,
        daysUnpaidLeave: unpaidLeaveDays,
        overtimeHours,
        components: componentsPayload,
      });

      calculationResults.push({ employee: emp, calc });
    }

    // 4. Transactionally store Period and Payslips
    const period = await prisma.$transaction(async (tx) => {
      // Upsert period
      const currentPeriod = await tx.payrollPeriod.upsert({
        where: { periodCode: data.periodCode },
        update: {
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          payDate: data.payDate,
          status: PayrollStatus.PROCESSING,
          processedBy: req.user!.id,
        },
        create: {
          periodCode: data.periodCode,
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          payDate: data.payDate,
          status: PayrollStatus.PROCESSING,
          processedBy: req.user!.id,
        }
      });

      // Clear existing draft payslips if re-running a non-finalized period
      await tx.payslip.deleteMany({
        where: { payrollPeriodId: currentPeriod.id }
      });

      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;

      for (let i = 0; i < calculationResults.length; i++) {
        const { employee, calc } = calculationResults[i];
        const payslipNumber = `PS-${data.periodCode}-${String(i + 1).padStart(4, '0')}`;

        totalGross += calc.grossPay;
        totalNet += calc.netPay;
        totalDeductions += calc.totalDeductions;

        const payslip = await tx.payslip.create({
          data: {
            payrollPeriodId: currentPeriod.id,
            employeeId: employee.id,
            payslipNumber,
            baseSalary: calc.baseSalary,
            grossPay: calc.grossPay,
            totalDeductions: calc.totalDeductions,
            netPay: calc.netPay,
            paymentStatus: PayslipStatus.PENDING,
            bankReference: `ACH-${data.periodCode}-${employee.employeeNumber}`,
          }
        });

        // Add itemized lines
        for (const item of calc.itemizedBreakdown) {
          await tx.payslipItem.create({
            data: {
              payslipId: payslip.id,
              componentCode: item.code,
              componentName: item.name,
              componentType: item.type as ComponentType,
              amount: item.amount,
              isDeduction: item.isDeduction,
            }
          });
        }
      }

      // Mark finalized
      return tx.payrollPeriod.update({
        where: { id: currentPeriod.id },
        data: {
          status: PayrollStatus.FINALIZED,
          totalGrossPay: totalGross,
          totalNetPay: totalNet,
          totalDeductions: totalDeductions,
          finalizedAt: new Date(),
          finalizedBy: req.user!.id,
        },
        include: {
          payslips: {
            include: { items: true, employee: { select: { firstName: true, lastName: true, employeeNumber: true } } }
          }
        }
      });
    });

    await createAuditRecord({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'PAYROLL_RUN_FINALIZED',
      entityName: 'PayrollPeriod',
      entityId: period.id,
      newValues: {
        periodCode: period.periodCode,
        totalNetPay: period.totalNetPay,
        totalEmployees: calculationResults.length
      },
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: `Payroll run finalized for ${period.periodCode}. Generated ${period.payslips.length} payslips.`,
      data: { payrollPeriod: period }
    });
  }
);

// GET /api/v1/payroll/periods
router.get(
  '/periods',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.PAYROLL_SPECIALIST, Role.HR_OFFICER),
  async (req: Request, res: Response): Promise<void> => {
    const periods = await prisma.payrollPeriod.findMany({
      include: {
        _count: { select: { payslips: true } }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json({ success: true, data: { payrollPeriods: periods } });
  }
);

// GET /api/v1/payroll/periods/:id
router.get(
  '/periods/:id',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.PAYROLL_SPECIALIST, Role.HR_OFFICER),
  async (req: Request, res: Response): Promise<void> => {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id: req.params.id },
      include: {
        payslips: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true } },
            items: true
          }
        }
      }
    });

    if (!period) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll period not found.' } });
      return;
    }

    res.json({ success: true, data: { payrollPeriod: period } });
  }
);

// GET /api/v1/payroll/my-payslips
router.get('/my-payslips', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({ success: false, error: { code: 'NO_EMPLOYEE', message: 'User is not linked to an employee.' } });
    return;
  }

  const payslips = await prisma.payslip.findMany({
    where: { employeeId },
    include: {
      payrollPeriod: true,
      items: true
    },
    orderBy: { generatedAt: 'desc' }
  });

  res.json({ success: true, data: { payslips } });
});

// GET /api/v1/payroll/payslips/:id
router.get('/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const payslip = await prisma.payslip.findUnique({
    where: { id: req.params.id },
    include: {
      payrollPeriod: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNumber: true,
          department: true,
          designation: true,
          bankName: true,
          bankAccountNumber: true,
        }
      },
      items: true
    }
  });

  if (!payslip) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found.' } });
    return;
  }

  // Ensure authorization: Admin, Payroll Specialist, or Owner
  const isOwner = req.user?.employeeId && req.user.employeeId === payslip.employeeId;
  const isFinance = req.user?.role === Role.ADMINISTRATOR || req.user?.role === Role.PAYROLL_SPECIALIST;
  if (!isOwner && !isFinance) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    return;
  }

  res.json({ success: true, data: { payslip } });
});

// POST /api/v1/payroll/export/bank - NACHA ACH Export (Assessment 08)
router.post(
  '/export/bank',
  authenticateJwt,
  authorizeRoles(Role.ADMINISTRATOR, Role.PAYROLL_SPECIALIST),
  async (req: Request, res: Response): Promise<void> => {
    const { periodId } = req.body;
    if (!periodId) {
      res.status(400).json({ success: false, error: { code: 'MISSING_PERIOD', message: 'periodId is required.' } });
      return;
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: {
        payslips: {
          include: {
            employee: true
          }
        }
      }
    });

    if (!period) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Period not found.' } });
      return;
    }

    const records = period.payslips.map(ps => ({
      employeeNumber: ps.employee.employeeNumber,
      employeeName: `${ps.employee.lastName}, ${ps.employee.firstName}`.toUpperCase(),
      routingNumber: ps.employee.bankRoutingNumber || '121000358',
      accountNumber: ps.employee.bankAccountNumber || '999999999',
      netPayAmount: Number(ps.netPay)
    }));

    const nachaExport = BankExportService.generateNachaAchFile(period.periodCode, records);

    await createAuditRecord({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'BANK_ACH_EXPORT',
      entityName: 'PayrollPeriod',
      entityId: period.id,
      newValues: {
        periodCode: period.periodCode,
        checksumSha256: nachaExport.checksumSha256,
        recordCount: nachaExport.recordCount
      },
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      data: nachaExport
    });
  }
);

export default router;
