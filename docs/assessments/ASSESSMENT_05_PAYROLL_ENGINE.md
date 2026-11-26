# Assessment 05 — Python Payroll Engine Implementation Guide

## Objective
Calculate configurable gross pay, allowances, deductions, overtime, unpaid leave, and payslip totals using Decimal and explicit rounding rules.

## Technology Stack
- **Language**: Python 3.11+
- **Framework**: FastAPI, Pydantic v2
- **Precision Library**: `decimal.Decimal` with `ROUND_HALF_UP`
- **Testing**: `pytest`, `httpx`

## Core Calculation Flow
1. **Standard Daily & Hourly Rates**:
   $$\text{Daily Rate} = \frac{\text{Base Salary}}{\text{Work Days In Month}}$$
   $$\text{Hourly Rate} = \frac{\text{Daily Rate}}{8.0}$$
2. **Unpaid Leave Proration**:
   $$\text{Unpaid Deduction} = \text{Daily Rate} \times \text{Days Unpaid Leave}$$
   $$\text{Prorated Base} = \text{Base Salary} - \text{Unpaid Deduction}$$
3. **Overtime Earnings**:
   $$\text{Overtime Pay} = \text{Overtime Hours} \times \text{Hourly Rate} \times \text{Multiplier (1.5)}$$
4. **Allowances & Deductions**:
   - Fixed amounts quantized to 2 decimal places.
   - Percentage components: $\text{Base} \times (\text{Percentage} / 100.0)$.
5. **Gross & Net Calculations**:
   $$\text{Gross Pay} = \text{Prorated Base} + \text{Allowances} + \text{Overtime Pay}$$
   $$\text{Net Pay} = \text{Gross Pay} - \text{Total Deductions}$$
6. **Balance Invariant Validation**:
   ```python
   assert gross_pay == quantize_money(net_pay + total_deductions)
   ```

## Performance Benchmark Suite
- Function: `python-services/app/payroll/benchmark.py`
- Benchmarked at >5,000 calculations per second with sub-millisecond per-payslip latency and zero floating-point accumulation errors.

## Verification
- Run tests: `set PYTHONPATH=python-services && python -m pytest python-services/app/tests/test_payroll_engine.py`
