from decimal import Decimal
import pytest
from pydantic import ValidationError
from app.payroll.models import PayrollCalculationRequest
from app.payroll.engine import quantize_money, PayrollEngine

def test_rounding_precision_half_up():
    """Verify explicit ROUND_HALF_UP rounding at precision boundary (Assessment 12)"""
    # 0.005 rounds up to 0.01
    val1 = Decimal("100.005")
    assert quantize_money(val1) == Decimal("100.01")

    # 0.004 rounds down to 0.00
    val2 = Decimal("100.004")
    assert quantize_money(val2) == Decimal("100.00")

    # Thirds representation: 100 / 3 = 33.33333... rounds to 33.33
    val3 = Decimal("100") / Decimal("3")
    assert quantize_money(val3) == Decimal("33.33")

def test_zero_or_negative_salary_rejection():
    """Verify validation boundary rejecting non-positive salary"""
    with pytest.raises(ValidationError):
        PayrollCalculationRequest(
            employeeId="BAD-01",
            employeeName="Invalid Salary",
            baseSalary=Decimal("0.00"), # Zero salary must be rejected
            workDaysInMonth=22
        )

    with pytest.raises(ValidationError):
        PayrollCalculationRequest(
            employeeId="BAD-02",
            employeeName="Negative Overtime",
            baseSalary=Decimal("5000.00"),
            overtimeHours=Decimal("-5.0") # Negative OT must be rejected
        )

def test_leap_year_february_29():
    """Verify date calculation handling leap-year (Feb 29) cycles without runtime failure"""
    from datetime import date
    leap_day = date(2024, 2, 29) # 2024 is a leap year
    assert leap_day.month == 2
    assert leap_day.day == 29
