# Assessment 06 — FastAPI Workforce Analytics Implementation Guide

## Objective
Build headcount, attendance, leave utilization, hiring, and attrition trend reports using synthetic data and transparent calculations.

## Technology Stack
- **Service**: Python 3.11+, FastAPI
- **Data Generator**: `python-services/app/analytics/synthetic_data.py` (generates 180 realistic records across 24 months)
- **Analytics Engine**: `python-services/app/analytics/engine.py`

## Transparent Calculation Formulas
1. **Annual Turnover Rate**:
   $$\text{Turnover Rate (\%)} = \frac{\text{Departures during period}}{\text{Average Headcount during period}} \times 100$$
2. **Workforce Retention Rate**:
   $$\text{Retention Rate (\%)} = 100 - \text{Turnover Rate (\%仿)}$$
3. **Attendance Rate**:
   $$\text{Attendance Rate (\%)} = \frac{\text{Attended Work Days}}{\text{Required Scheduled Days}} \times 100$$
4. **Leave Utilization**:
   $$\text{Leave Utilization (\%)} = \frac{\text{Used Leave Days}}{\text{Total Allocated Entitlement Days}} \times 100$$

## Verification & Tests
- Pytest suite: `python-services/app/tests/test_analytics.py`
- Run: `set PYTHONPATH=python-services && python -m pytest python-services/app/tests/test_analytics.py`
- API query: `GET http://localhost:8000/api/v1/analytics/summary`
