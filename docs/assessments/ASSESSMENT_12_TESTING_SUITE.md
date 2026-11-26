# Assessment 12 — Payroll and HR Testing Implementation Guide

## Objective
Test rounding, leap-year dates, overnight shifts, leave overlap, duplicate payroll execution, salary visibility, and corrections.

## Automated Test Suites

### 1. Python Pytest Test Suite (`python-services/app/tests/`)
- `test_payroll_engine.py`: Tests standard payroll calculation, overtime multipliers, unpaid leave deductions.
- `test_analytics.py`: Tests turnover rate, attendance percentage, and synthetic data accuracy.
- `test_edge_cases.py`: Tests `ROUND_HALF_UP` boundary precision ($0.005 vs $0.004), leap-year Feb 29 processing, zero salary validation rejections.

### 2. Node.js Jest Test Suite (`backend/tests/`)
- `auth_rbac.test.ts`: Tests role authorization, token verification, and field-level salary masking.
- `attendance_leave.test.ts`: Tests overnight shift calculations across midnight, overlapping leave collisions, and NACHA 94-char formatting.
- `payroll_idempotency.test.ts`: Tests idempotent payroll execution, duplicate run rejection, and net pay invariants.

## Running Tests
- Python: `set PYTHONPATH=python-services && python -m pytest python-services/app/tests`
- Node.js: `cd backend && npm test`
