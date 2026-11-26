from decimal import Decimal
import pytest
from app.payroll.models import (
    PayrollCalculationRequest,
    SalaryComponentInput,
    ComponentType,
    CalculationType
)
from app.payroll.engine import PayrollEngine, quantize_money

def test_standard_payroll_calculation():
    """Verify standard monthly pay with fixed allowances and statutory deductions"""
    request = PayrollCalculationRequest(
        employeeId="EMP-001",
        employeeName="John Doe",
        baseSalary=Decimal("10000.00"),
        workDaysInMonth=20,
        daysPresent=20,
        daysPaidLeave=0,
        daysUnpaidLeave=0,
        overtimeHours=Decimal("0.0"),
        components=[
            SalaryComponentInput(
                code="HOUSING",
                name="Housing Allowance",
                type=ComponentType.EARNING,
                calculationType=CalculationType.PERCENTAGE_OF_BASE,
                value=Decimal("15.0") # 15% of 10,000 = 1,500
            ),
            SalaryComponentInput(
                code="TRANSPORT",
                name="Transport Allowance",
                type=ComponentType.EARNING,
                calculationType=CalculationType.FIXED,
                value=Decimal("250.00")
            ),
            SalaryComponentInput(
                code="TAX",
                name="Income Tax",
                type=ComponentType.DEDUCTION,
                calculationType=CalculationType.PERCENTAGE_OF_BASE,
                value=Decimal("20.0"), # 20% of 10,000 = 2,000
                isStatutory=True
            ),
            SalaryComponentInput(
                code="HEALTH",
                name="Health Insurance",
                type=ComponentType.DEDUCTION,
                calculationType=CalculationType.FIXED,
                value=Decimal("300.00"),
                isStatutory=False
            )
        ]
    )

    result = PayrollEngine.calculate(request)

    assert result.baseSalary == Decimal("10000.00")
    assert result.proratedBaseSalary == Decimal("10000.00")
    assert result.allowancesTotal == Decimal("1750.00") # 1500 + 250
    assert result.grossPay == Decimal("11750.00") # 10000 + 1750
    assert result.statutoryDeductions == Decimal("2000.00")
    assert result.voluntaryDeductions == Decimal("300.00")
    assert result.totalDeductions == Decimal("2300.00")
    assert result.netPay == Decimal("9450.00") # 11750 - 2300
    assert result.grossPay == result.netPay + result.totalDeductions

def test_unpaid_leave_proration_and_overtime():
    """Verify that unpaid absences prorate salary and overtime hours multiply accurately"""
    request = PayrollCalculationRequest(
        employeeId="EMP-002",
        employeeName="Jane Smith",
        baseSalary=Decimal("8800.00"),
        workDaysInMonth=22, # daily rate = 400.00, hourly rate = 50.00
        daysPresent=20,
        daysPaidLeave=0,
        daysUnpaidLeave=2, # 2 days unpaid = 800.00 deduction
        overtimeHours=Decimal("10.0"), # 10 hrs * 50 * 1.5 = 750.00 OT
        overtimeHourlyRateMultiplier=Decimal("1.5"),
        components=[]
    )

    result = PayrollEngine.calculate(request)

    assert result.unpaidLeaveDeduction == Decimal("800.00")
    assert result.proratedBaseSalary == Decimal("8000.00") # 8800 - 800
    assert result.overtimePay == Decimal("750.00")
    assert result.grossPay == Decimal("8750.00") # 8000 + 750
    assert result.netPay == Decimal("8750.00")
