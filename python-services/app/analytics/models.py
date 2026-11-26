from typing import List, Dict, Any
from pydantic import BaseModel

class MonthlyTrendPoint(BaseModel):
    month: str # "YYYY-MM"
    startingHeadcount: int
    newHires: int
    departures: int
    endingHeadcount: int
    turnoverRatePct: float

class DepartmentMetric(BaseModel):
    department: str
    headcount: int
    percentageOfTotal: float
    avgTenureMonths: float

class AttendanceUtilizationMetric(BaseModel):
    overallAttendanceRatePct: float
    onTimeRatePct: float
    lateRatePct: float
    absentRatePct: float
    totalRecordedDays: int

class LeaveUtilizationMetric(BaseModel):
    leaveType: str
    totalAllocatedDays: float
    totalUsedDays: float
    utilizationRatePct: float

class WorkforceAnalyticsSummary(BaseModel):
    currentTotalHeadcount: int
    activeEmployees: int
    annualTurnoverRatePct: float
    retentionRatePct: float
    avgCompanyTenureMonths: float
    monthlyTrends: List[MonthlyTrendPoint]
    departmentBreakdown: List[DepartmentMetric]
    attendanceMetrics: AttendanceUtilizationMetric
    leaveUtilization: List[LeaveUtilizationMetric]
    calculationMethodology: Dict[str, str]
