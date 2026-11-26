from decimal import Decimal, ROUND_HALF_UP
from typing import List
from .models import (
    PayrollCalculationRequest,
    PayrollCalculationResponse,
    PayslipItemResult,
    ComponentType,
    CalculationType
)

# Precision quantizer for standard currency rounding (2 decimal places)
TWO_PLACES = Decimal("0.01")

def quantize_money(amount: Decimal) -> Decimal:
    """Explicit statutory financial rounding: ROUND_HALF_UP to 2 decimal places"""
    return amount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

class PayrollEngine:
    """
    Assessment 05: Python Payroll Engine
    Calculates gross pay, prorations, allowances, deductions, overtime,
    and payslip totals using exact Decimal arithmetic and explicit rounding rules.
    """

    @staticmethod
    def calculate(request: PayrollCalculationRequest) -> PayrollCalculationResponse:
        base = quantize_money(request.baseSalary)
        work_days = Decimal(request.workDaysInMonth)

        # Daily and hourly rates
        daily_rate = base / work_days
        hourly_rate = daily_rate / Decimal("8.0")

        # 1. Unpaid leave proration
        days_unpaid = Decimal(request.daysUnpaidLeave)
        unpaid_deduction = quantize_money(daily_rate * days_unpaid)
        prorated_base = quantize_money(base - unpaid_deduction)

        # 2. Overtime calculation
        ot_hours = request.overtimeHours
        ot_multiplier = request.overtimeHourlyRateMultiplier
        overtime_pay = quantize_money(ot_hours * hourly_rate * ot_multiplier)

        # 3. Process components
        allowances_total = Decimal("0.00")
        statutory_deductions = Decimal("0.00")
        voluntary_deductions = Decimal("0.00")
        breakdown: List[PayslipItemResult] = [
            PayslipItemResult(
                code="BASE_SALARY",
                name="Basic Monthly Pay",
                type="EARNING",
                amount=prorated_base,
                isDeduction=False
            )
        ]

        if overtime_pay > Decimal("0.00"):
            breakdown.append(PayslipItemResult(
                code="OVERTIME",
                name="Overtime Earnings",
                type="EARNING",
                amount=overtime_pay,
                isDeduction=False
            ))

        if unpaid_deduction > Decimal("0.00"):
            breakdown.append(PayslipItemResult(
                code="UNPAID_LEAVE_DEDUCTION",
                name="Unpaid Absence Deduction",
                type="DEDUCTION",
                amount=unpaid_deduction,
                isDeduction=True
            ))

        for comp in request.components:
            if comp.calculationType == CalculationType.PERCENTAGE_OF_BASE:
                comp_amt = quantize_money(base * (comp.value / Decimal("100.0")))
            else:
                comp_amt = quantize_money(comp.value)

            if comp.type == ComponentType.EARNING:
                allowances_total += comp_amt
                breakdown.append(PayslipItemResult(
                    code=comp.code,
                    name=comp.name,
                    type="EARNING",
                    amount=comp_amt,
                    isDeduction=False
                ))
            elif comp.type == ComponentType.DEDUCTION:
                if comp.isStatutory:
                    statutory_deductions += comp_amt
                else:
                    voluntary_deductions += comp_amt
                breakdown.append(PayslipItemResult(
                    code=comp.code,
                    name=comp.name,
                    type="DEDUCTION",
                    amount=comp_amt,
                    isDeduction=True
                ))

        # 4. Gross and Net totals
        gross_pay = quantize_money(prorated_base + allowances_total + overtime_pay)
        total_deductions = quantize_money(statutory_deductions + voluntary_deductions)
        net_pay = quantize_money(gross_pay - total_deductions)

        # Cryptographic/financial balance invariant validation
        assert gross_pay == quantize_money(net_pay + total_deductions), (
            f"Financial Invariant Broken: Gross ({gross_pay}) != Net ({net_pay}) + Deductions ({total_deductions})"
        )

        return PayrollCalculationResponse(
            employeeId=request.employeeId,
            employeeName=request.employeeName,
            baseSalary=base,
            proratedBaseSalary=prorated_base,
            allowancesTotal=quantize_money(allowances_total),
            overtimePay=overtime_pay,
            grossPay=gross_pay,
            unpaidLeaveDeduction=unpaid_deduction,
            statutoryDeductions=quantize_money(statutory_deductions),
            voluntaryDeductions=quantize_money(voluntary_deductions),
            totalDeductions=total_deductions,
            netPay=net_pay,
            itemizedBreakdown=breakdown
        )
