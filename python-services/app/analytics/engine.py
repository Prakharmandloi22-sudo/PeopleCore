from datetime import date
from typing import List, Dict, Any
from .models import (
    WorkforceAnalyticsSummary,
    MonthlyTrendPoint,
    DepartmentMetric,
    AttendanceUtilizationMetric,
    LeaveUtilizationMetric
)
from .synthetic_data import generate_synthetic_workforce_data

class AnalyticsEngine:
    """
    Assessment 06: FastAPI Workforce Analytics Engine
    Computes transparent workforce metrics:
    - Headcount trends over past 12 months
    - Turnover rate = (departures / average_headcount) * 100
    - Retention rate = 100 - Turnover rate
    - Attendance rate = (days_attended / total_workdays) * 100
    - Leave utilization = (used_days / allocated_days) * 100
    """

    @staticmethod
    def compute_summary(custom_data: List[Dict[str, Any]] = None) -> WorkforceAnalyticsSummary:
        dataset = custom_data if custom_data is not None else generate_synthetic_workforce_data(180)
        
        total_records = len(dataset)
        active_records = [r for r in dataset if r["status"] == "ACTIVE"]
        terminated_records = [r for r in dataset if r["status"] == "TERMINATED"]

        current_headcount = len(active_records)
        total_departures = len(terminated_records)

        # Average company tenure
        reference_date = date(2026, 3, 1)
        tenure_months_list = []
        for r in dataset:
            end = r["terminationDate"] if r["terminationDate"] else reference_date
            months = (end.year - r["hireDate"].year) * 12 + (end.month - r["hireDate"].month)
            tenure_months_list.append(max(1, months))
        
        avg_tenure = sum(tenure_months_list) / len(tenure_months_list) if tenure_months_list else 0.0

        # Annual turnover rate
        avg_headcount = (current_headcount + (current_headcount + total_departures)) / 2.0
        turnover_rate = (total_departures / avg_headcount * 100.0) if avg_headcount > 0 else 0.0
        retention_rate = max(0.0, 100.0 - turnover_rate)

        # Monthly Trends (last 12 months)
        monthly_trends: List[MonthlyTrendPoint] = []
        months_window = [
            ("2025-04", date(2025, 4, 1), date(2025, 4, 30)),
            ("2025-05", date(2025, 5, 1), date(2025, 5, 31)),
            ("2025-06", date(2025, 6, 1), date(2025, 6, 30)),
            ("2025-07", date(2025, 7, 1), date(2025, 7, 31)),
            ("2025-08", date(2025, 8, 1), date(2025, 8, 31)),
            ("2025-09", date(2025, 9, 1), date(2025, 9, 30)),
            ("2025-10", date(2025, 10, 1), date(2025, 10, 31)),
            ("2025-11", date(2025, 11, 1), date(2025, 11, 30)),
            ("2025-12", date(2025, 12, 1), date(2025, 12, 31)),
            ("2026-01", date(2026, 1, 1), date(2026, 1, 31)),
            ("2026-02", date(2026, 2, 1), date(2026, 2, 28)),
            ("2026-03", date(2026, 3, 1), date(2026, 3, 31)),
        ]

        for m_str, m_start, m_end in months_window:
            # Active at start of month
            start_hc = len([r for r in dataset if r["hireDate"] < m_start and (r["terminationDate"] is None or r["terminationDate"] >= m_start)])
            hires = len([r for r in dataset if m_start <= r["hireDate"] <= m_end])
            departures = len([r for r in dataset if r["terminationDate"] and m_start <= r["terminationDate"] <= m_end])
            end_hc = start_hc + hires - departures
            m_avg = (start_hc + end_hc) / 2.0 if (start_hc + end_hc) > 0 else 1.0
            m_turnover = (departures / m_avg) * 100.0

            monthly_trends.append(MonthlyTrendPoint(
                month=m_str,
                startingHeadcount=start_hc,
                newHires=hires,
                departures=departures,
                endingHeadcount=end_hc,
                turnoverRatePct=round(m_turnover, 2)
            ))

        # Department Breakdown
        dept_counts: Dict[str, int] = {}
        for r in active_records:
            d = r["department"]
            dept_counts[d] = dept_counts.get(d, 0) + 1

        dept_metrics: List[DepartmentMetric] = []
        for d, count in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True):
            pct = (count / current_headcount * 100.0) if current_headcount > 0 else 0.0
            dept_metrics.append(DepartmentMetric(
                department=d,
                headcount=count,
                percentageOfTotal=round(pct, 1),
                avgTenureMonths=round(avg_tenure, 1)
            ))

        # Attendance Metrics
        total_present = sum(r.get("daysPresent", 20) for r in active_records)
        total_late = sum(r.get("daysLate", 1) for r in active_records)
        total_absent = sum(r.get("daysAbsent", 0) for r in active_records)
        total_req_days = total_present + total_absent

        att_rate = (total_present / total_req_days * 100.0) if total_req_days > 0 else 100.0
        on_time_days = max(0, total_present - total_late)
        on_time_rate = (on_time_days / total_present * 100.0) if total_present > 0 else 100.0
        late_rate = (total_late / total_present * 100.0) if total_present > 0 else 0.0
        absent_rate = (total_absent / total_req_days * 100.0) if total_req_days > 0 else 0.0

        attendance_summary = AttendanceUtilizationMetric(
            overallAttendanceRatePct=round(att_rate, 2),
            onTimeRatePct=round(on_time_rate, 2),
            lateRatePct=round(late_rate, 2),
            absentRatePct=round(absent_rate, 2),
            totalRecordedDays=total_req_days
        )

        # Leave Utilization Metrics
        tot_ann_alloc = sum(r.get("annualLeaveAllocated", 20.0) for r in active_records)
        tot_ann_used = sum(r.get("annualLeaveUsed", 10.0) for r in active_records)
        tot_sick_alloc = sum(r.get("sickLeaveAllocated", 10.0) for r in active_records)
        tot_sick_used = sum(r.get("sickLeaveUsed", 2.0) for r in active_records)

        leave_metrics = [
            LeaveUtilizationMetric(
                leaveType="Annual Paid Leave",
                totalAllocatedDays=round(tot_ann_alloc, 1),
                totalUsedDays=round(tot_ann_used, 1),
                utilizationRatePct=round((tot_ann_used / tot_ann_alloc * 100.0) if tot_ann_alloc > 0 else 0.0, 2)
            ),
            LeaveUtilizationMetric(
                leaveType="Sick & Medical Leave",
                totalAllocatedDays=round(tot_sick_alloc, 1),
                totalUsedDays=round(tot_sick_used, 1),
                utilizationRatePct=round((tot_sick_used / tot_sick_alloc * 100.0) if tot_sick_alloc > 0 else 0.0, 2)
            )
        ]

        return WorkforceAnalyticsSummary(
            currentTotalHeadcount=current_headcount,
            activeEmployees=current_headcount,
            annualTurnoverRatePct=round(turnover_rate, 2),
            retentionRatePct=round(retention_rate, 2),
            avgCompanyTenureMonths=round(avg_tenure, 1),
            monthlyTrends=monthly_trends,
            departmentBreakdown=dept_metrics,
            attendanceMetrics=attendance_summary,
            leaveUtilization=leave_metrics,
            calculationMethodology={
                "turnoverRate": "Departures during period / Average headcount during period * 100",
                "attendanceRate": "Attended work days / Required scheduled work days * 100",
                "leaveUtilizationRate": "Used leave days / Total allocated entitlement days * 100",
                "retentionRate": "100 - Annual Turnover Rate"
            }
        )
