# Assessment 15 — HRMS Incident Simulation Guide

## Objective
Investigate incorrect pay totals, duplicate payroll, attendance discrepancies, unauthorized salary access, and failed scheduled jobs.

## Executable Incident Reproduction Script
- Script: `scripts/incident_simulation.py`
- Run: `python scripts/incident_simulation.py`

## Verified Incident Scenarios & Capstone Resolution
1. **Incident 1**: Floating-point drift vs Decimal `ROUND_HALF_UP` precision.
2. **Incident 2 & Capstone Challenge**: Duplicate payroll run race condition prevented via PostgreSQL unique constraints and idempotent status checks.
3. **Incident 3**: Overnight shift attendance cross-day evaluation.
4. **Incident 4**: Unauthorized salary access attempt intercepted with dynamic masking and audit trail generation.
5. **Incident 5**: Failed background payroll job recovered using checkpoint offsets without duplicate payouts.

Detailed operational runbooks: Refer to `docs/INCIDENT_RUNBOOKS.md`.
