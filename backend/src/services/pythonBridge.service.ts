import { config, logger } from '../config';

export interface PythonPayrollCalculationRequest {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  workDaysInMonth: number;
  daysPresent: number;
  daysPaidLeave: number;
  daysUnpaidLeave: number;
  overtimeHours: number;
  overtimeHourlyRateMultiplier?: number;
  components: Array<{
    code: string;
    name: string;
    type: 'EARNING' | 'DEDUCTION' | 'BENEFIT';
    calculationType: 'FIXED' | 'PERCENTAGE_OF_BASE' | 'FORMULA';
    value: number;
    isTaxable?: boolean;
    isStatutory?: boolean;
  }>;
}

export interface PythonPayrollCalculationResult {
  baseSalary: number;
  proratedBaseSalary: number;
  allowancesTotal: number;
  grossPay: number;
  overtimePay: number;
  unpaidLeaveDeduction: number;
  statutoryDeductions: number;
  voluntaryDeductions: number;
  totalDeductions: number;
  netPay: number;
  itemizedBreakdown: Array<{
    code: string;
    name: string;
    type: string;
    amount: number;
    isDeduction: boolean;
  }>;
}

/**
 * Bridge client communicating with the Python FastAPI microservices
 */
export class PythonBridgeService {
  /**
   * Delegates Decimal-precision payroll calculation to FastAPI payroll engine
   */
  public static async calculatePayroll(
    payload: PythonPayrollCalculationRequest
  ): Promise<PythonPayrollCalculationResult> {
    try {
      const response = await fetch(`${config.pythonServiceUrl}/api/v1/payroll/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': config.pythonApiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python payroll microservice failed with status ${response.status}: ${errorText}`);
      }

      return (await response.json()) as PythonPayrollCalculationResult;
    } catch (err: any) {
      logger.warn(`Python service bridge unreachable or error (${err.message}). Falling back to local Node engine.`);
      return this.localPayrollFallback(payload);
    }
  }

  /**
   * Resilient fallback local calculation if Python service is in cold-start or offline
   */
  public static localPayrollFallback(
    req: PythonPayrollCalculationRequest
  ): PythonPayrollCalculationResult {
    const base = Number(req.baseSalary);
    const workDays = req.workDaysInMonth || 22;
    const unpaidRatio = (req.daysUnpaidLeave || 0) / workDays;
    const unpaidDeduction = Math.round(base * unpaidRatio * 100) / 100;
    const proratedBase = Math.round((base - unpaidDeduction) * 100) / 100;

    const hourlyRate = base / (workDays * 8);
    const otMultiplier = req.overtimeHourlyRateMultiplier || 1.5;
    const otPay = Math.round((req.overtimeHours || 0) * hourlyRate * otMultiplier * 100) / 100;

    let allowances = 0;
    let statutory = 0;
    let voluntary = 0;
    const breakdown: any[] = [
      { code: 'BASE_SALARY', name: 'Basic Monthly Pay', type: 'EARNING', amount: proratedBase, isDeduction: false }
    ];

    if (otPay > 0) {
      breakdown.push({ code: 'OVERTIME', name: 'Overtime Earnings', type: 'EARNING', amount: otPay, isDeduction: false });
    }

    req.components.forEach((c) => {
      let amt = 0;
      if (c.calculationType === 'PERCENTAGE_OF_BASE') {
        amt = Math.round((base * (c.value / 100)) * 100) / 100;
      } else {
        amt = Math.round(c.value * 100) / 100;
      }

      if (c.type === 'EARNING') {
        allowances += amt;
        breakdown.push({ code: c.code, name: c.name, type: 'EARNING', amount: amt, isDeduction: false });
      } else if (c.type === 'DEDUCTION') {
        if (c.isStatutory) {
          statutory += amt;
        } else {
          voluntary += amt;
        }
        breakdown.push({ code: c.code, name: c.name, type: 'DEDUCTION', amount: amt, isDeduction: true });
      }
    });

    const gross = Math.round((proratedBase + allowances + otPay) * 100) / 100;
    const totalDeductions = Math.round((statutory + voluntary) * 100) / 100;
    const net = Math.round((gross - totalDeductions) * 100) / 100;

    return {
      baseSalary: base,
      proratedBaseSalary: proratedBase,
      allowancesTotal: allowances,
      grossPay: gross,
      overtimePay: otPay,
      unpaidLeaveDeduction: unpaidDeduction,
      statutoryDeductions: statutory,
      voluntaryDeductions: voluntary,
      totalDeductions,
      netPay: net,
      itemizedBreakdown: breakdown,
    };
  }
}
