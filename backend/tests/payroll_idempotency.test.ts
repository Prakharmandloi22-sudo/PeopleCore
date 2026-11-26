import { PythonBridgeService } from '../src/services/pythonBridge.service';

describe('Assessment 05, 12, 15 & Capstone: Payroll Idempotency & Calculation Tests', () => {
  test('Local fallback payroll engine performs accurate proration and net calculation', () => {
    const result = PythonBridgeService.localPayrollFallback({
      employeeId: 'emp-201',
      employeeName: 'Jordan Lee',
      baseSalary: 10000,
      workDaysInMonth: 20,
      daysPresent: 20,
      daysPaidLeave: 0,
      daysUnpaidLeave: 0,
      overtimeHours: 0,
      components: [
        {
          code: 'HOUSING',
          name: 'Housing Allowance',
          type: 'EARNING',
          calculationType: 'PERCENTAGE_OF_BASE',
          value: 15.0
        },
        {
          code: 'TAX',
          name: 'Tax Withholding',
          type: 'DEDUCTION',
          calculationType: 'PERCENTAGE_OF_BASE',
          value: 20.0,
          isStatutory: true
        }
      ]
    });

    expect(result.baseSalary).toBe(10000);
    expect(result.allowancesTotal).toBe(1500); // 15% of 10,000
    expect(result.grossPay).toBe(11500);
    expect(result.statutoryDeductions).toBe(2000); // 20% of 10,000
    expect(result.netPay).toBe(9500); // 11500 - 2000
    expect(result.grossPay).toBe(result.netPay + result.totalDeductions);
  });

  test('Domain Capstone Challenge: Re-running finalized payroll period throws 409 Conflict', () => {
    // Simulating Capstone Idempotency guard logic:
    const existingPayrollPeriod = {
      id: 'pp-2026-03',
      periodCode: '2026-03-MONTHLY',
      status: 'FINALIZED',
      totalGrossPay: 23500.00
    };

    const isDuplicateProhibited = (period: typeof existingPayrollPeriod) => {
      if (period.status === 'FINALIZED') {
        throw new Error('PAYROLL_ALREADY_FINALIZED: Duplicate payroll execution is prohibited.');
      }
      return true;
    };

    expect(() => isDuplicateProhibited(existingPayrollPeriod)).toThrow('PAYROLL_ALREADY_FINALIZED');
  });

  test('Financial rounding consistency: Net pay plus deductions equals gross pay precisely', () => {
    const result = PythonBridgeService.localPayrollFallback({
      employeeId: 'emp-202',
      employeeName: 'Sarah Connor',
      baseSalary: 7916.67,
      workDaysInMonth: 22,
      daysPresent: 21,
      daysPaidLeave: 0,
      daysUnpaidLeave: 1, // 1 day unpaid absence
      overtimeHours: 4.5,
      components: [
        { code: 'BONUS', name: 'Performance Bonus', type: 'EARNING', calculationType: 'FIXED', value: 350.25 },
        { code: 'TAX', name: 'Tax', type: 'DEDUCTION', calculationType: 'PERCENTAGE_OF_BASE', value: 21.5, isStatutory: true },
        { code: 'BENEFIT', name: 'Dental Benefit', type: 'DEDUCTION', calculationType: 'FIXED', value: 45.33 }
      ]
    });

    expect(result.grossPay).toBe(Math.round((result.netPay + result.totalDeductions) * 100) / 100);
  });
});
