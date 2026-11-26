from decimal import Decimal
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class ComponentType(str, Enum):
    EARNING = "EARNING"
    DEDUCTION = "DEDUCTION"
    BENEFIT = "BENEFIT"

class CalculationType(str, Enum):
    FIXED = "FIXED"
    PERCENTAGE_OF_BASE = "PERCENTAGE_OF_BASE"
    FORMULA = "FORMULA"

class SalaryComponentInput(BaseModel):
    code: str = Field(..., description="Unique component code, e.g. HOUSING")
    name: str = Field(..., description="Human readable name")
    type: ComponentType
    calculationType: CalculationType = CalculationType.FIXED
    value: Decimal = Field(..., ge=0, description="Fixed dollar amount or percentage")
    isTaxable: bool = True
    isStatutory: bool = False

class PayrollCalculationRequest(BaseModel):
    employeeId: str
    employeeName: str
    baseSalary: Decimal = Field(..., gt=0, description="Monthly base salary in Decimal precision")
    workDaysInMonth: int = Field(22, ge=1, le=31, description="Standard working days in the pay cycle")
    daysPresent: int = Field(22, ge=0, le=31)
    daysPaidLeave: int = Field(0, ge=0, le=31)
    daysUnpaidLeave: int = Field(0, ge=0, le=31)
    overtimeHours: Decimal = Field(Decimal("0.0"), ge=0)
    overtimeHourlyRateMultiplier: Decimal = Field(Decimal("1.5"), ge=1.0)
    components: List[SalaryComponentInput] = Field(default_factory=list)

class PayslipItemResult(BaseModel):
    code: str
    name: str
    type: str
    amount: Decimal
    isDeduction: bool

class PayrollCalculationResponse(BaseModel):
    employeeId: str
    employeeName: str
    baseSalary: Decimal
    proratedBaseSalary: Decimal
    allowancesTotal: Decimal
    overtimePay: Decimal
    grossPay: Decimal
    unpaidLeaveDeduction: Decimal
    statutoryDeductions: Decimal
    voluntaryDeductions: Decimal
    totalDeductions: Decimal
    netPay: Decimal
    itemizedBreakdown: List[PayslipItemResult]
    roundingRuleApplied: str = "ROUND_HALF_UP (Precision: 2 decimal places)"
