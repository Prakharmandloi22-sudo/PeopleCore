import pytest
from datetime import date
from app.analytics.engine import AnalyticsEngine
from app.analytics.models import WorkforceAnalyticsSummary

def test_workforce_analytics_synthetic_summary():
    """Verify calculation of transparent workforce analytics metrics"""
    summary: WorkforceAnalyticsSummary = AnalyticsEngine.compute_summary()

    assert summary.currentTotalHeadcount > 0
    assert summary.annualTurnoverRatePct >= 0.0
    assert summary.retentionRatePct <= 100.0
    assert len(summary.monthlyTrends) == 12
    assert len(summary.departmentBreakdown) >= 3
    assert summary.attendanceMetrics.overallAttendanceRatePct > 0.0
    assert summary.attendanceMetrics.overallAttendanceRatePct <= 100.0
    assert len(summary.leaveUtilization) >= 2

def test_analytics_deterministic_formulas():
    """Verify exact formula behavior with controlled custom dataset"""
    custom_dataset = [
        {
            "employeeNumber": "EMP-001",
            "department": "Engineering",
            "employmentType": "FULL_TIME",
            "status": "ACTIVE",
            "hireDate": date(2025, 1, 1),
            "terminationDate": None,
            "daysPresent": 20,
            "daysLate": 0,
            "daysAbsent": 0,
            "annualLeaveAllocated": 20.0,
            "annualLeaveUsed": 5.0,
            "sickLeaveAllocated": 10.0,
            "sickLeaveUsed": 1.0,
        },
        {
            "employeeNumber": "EMP-002",
            "department": "Engineering",
            "employmentType": "FULL_TIME",
            "status": "TERMINATED",
            "hireDate": date(2025, 2, 1),
            "terminationDate": date(2025, 8, 1),
            "daysPresent": 18,
            "daysLate": 2,
            "daysAbsent": 2,
            "annualLeaveAllocated": 20.0,
            "annualLeaveUsed": 10.0,
            "sickLeaveAllocated": 10.0,
            "sickLeaveUsed": 2.0,
        }
    ]

    summary = AnalyticsEngine.compute_summary(custom_dataset)

    assert summary.currentTotalHeadcount == 1
    # Departures = 1, current = 1, total = 2, avg headcount = (1 + 2)/2 = 1.5 => turnover = 1/1.5 * 100 = 66.67%
    assert summary.annualTurnoverRatePct == 66.67
    assert summary.retentionRatePct == 33.33
