# PeopleCore HRMS — Operational Incident Runbooks & Capstone RCA
**Assessment 15 & Domain Capstone Challenge**

---

## Incident 1: Incorrect Pay Totals & Float Rounding Drift

### 1. Symptom & Alert Trigger
- **Alert**: `FINANCIAL_INVARIANT_MISMATCH` triggered during payroll reconciliation.
- **Observed Behavior**: The sum of itemized net pays plus statutory deductions differed from the calculated gross pay by fractions of a cent ($0.000965), accumulating across 10,000 employees into significant balance sheet discrepancies.

### 2. Root Cause Analysis (RCA)
- The legacy engine used IEEE-754 binary double-precision floating-point numbers (`Number` in JS or `float` in Python).
- Fractional numbers like `0.1` and `0.2` cannot be represented exactly in binary floating point, leading to cumulative truncation and rounding drift.

### 3. Immediate Remediation & Fix
- Replaced all numeric compensation variables with `Decimal` in Python (`app/payroll/engine.py`).
- Enforced statutory financial rounding using `ROUND_HALF_UP` quantized to 2 decimal places (`Decimal("0.01")`).
- Added cryptographic invariant validation check:
  ```python
  assert gross_pay == quantize_money(net_pay + total_deductions)
  ```

### 4. Prevention & Automated Test
- Executed via `scripts/incident_simulation.py` (Scenario 1) and `python-services/app/tests/test_edge_cases.py`.

---

## Incident 2 & Capstone Challenge: Duplicate Payroll Race Condition

### 1. Symptom & Alert Trigger
- **Alert**: Double disbursement risk detected when two payroll specialists clicked "Run Payroll" simultaneously for the same monthly cycle.
- **Observed Behavior**: Concurrent API requests attempted to create duplicate payslips and double debit company disbursement accounts.

### 2. Root Cause Analysis (RCA)
- Read-then-write race condition: The check `payrollPeriod.status !== 'FINALIZED'` was evaluated by both worker threads prior to either transaction committing.

### 3. Immediate Remediation & Fix
- Added database-level unique composite constraint in PostgreSQL:
  ```prisma
  @@unique([payrollPeriodId, employeeId])
  ```
- Implemented transactional status locking:
  ```typescript
  if (existingPeriod && existingPeriod.status === PayrollStatus.FINALIZED) {
    return res.status(409).json({
      error: { code: 'PAYROLL_ALREADY_FINALIZED', message: 'Re-running a finalized payroll is prohibited.' }
    });
  }
  ```

### 4. Prevention & Automated Test
- Verified in `backend/tests/payroll_idempotency.test.ts` and `scripts/incident_simulation.py` (Scenario 2).

---

## Incident 3: Overnight Shift Attendance Discrepancy

### 1. Symptom & Alert Trigger
- **Alert**: Overnight site reliability engineer reported 0 total hours and marked "ABSENT" after clocking out at 06:00 AM.
- **Observed Behavior**: System looked for a check-in on the current calendar date (e.g. March 24), missing the check-in from 22:00 on the previous calendar date (March 23).

### 2. Root Cause Analysis (RCA)
- Attendance records were queried strictly on `date == todayDateOnly`, failing to account for overnight shifts where `shift.isOvernight == true`.

### 3. Immediate Remediation & Fix
- Updated `backend/src/modules/attendance/attendance.routes.ts`: If no check-in is found on the current date, the engine inspects yesterday's record for active overnight check-in:
  ```typescript
  if (!record || !record.checkInTime) {
    const yesterdayRecord = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: yesterdayDateOnly } },
      include: { shift: true }
    });
    if (yesterdayRecord?.shift?.isOvernight && !yesterdayRecord.checkOutTime) {
      record = yesterdayRecord;
    }
  }
  ```

### 4. Prevention & Automated Test
- Verified in `backend/tests/attendance_leave.test.ts` and `scripts/incident_simulation.py` (Scenario 3).

---

## Incident 4: Unauthorized Salary & Compensation Field Access

### 1. Symptom & Alert Trigger
- **Alert**: `UNAUTHORIZED_RESOURCE_PROBE` emitted by application security monitors.
- **Observed Behavior**: An employee manipulated client requests to query `/api/v1/employees/emp-101` (Engineering Director) attempting to view executive base salary and banking details.

### 2. Root Cause Analysis (RCA)
- Endpoint returned raw database objects without field-level security checks or role verification.

### 3. Immediate Remediation & Fix
- Implemented `salaryMask.middleware.ts`:
  - `ADMINISTRATOR` and `PAYROLL_SPECIALIST`: Full visibility.
  - `EMPLOYEE`: Can only view their own full salary; all other profiles return `baseSalary: "***CONFIDENTIAL***"` and `bankAccountNumber: "****1234"`.
  - Every access is recorded in immutable `AuditLog` table.

### 4. Prevention & Automated Test
- Verified in `backend/tests/auth_rbac.test.ts` and `scripts/incident_simulation.py` (Scenario 4).

---

## Incident 5: Failed Scheduled Background Worker Job Recovery

### 1. Symptom & Alert Trigger
- **Alert**: `BULLMQ_WORKER_DEAD_LETTER` triggered during overnight payroll batch processing.
- **Observed Behavior**: Worker process died at record 61 of 100 due to a transient database network partition.

### 2. Root Cause Analysis (RCA)
- Entire batch was encapsulated in a single non-resilient loop without persistence checkpoints.

### 3. Immediate Remediation & Fix
- Implemented resume tokens and checkpoint offsets.
- On job retry, worker reads last committed `payslipNumber` offset and resumes from record 61 without re-processing records 1 to 60.

### 4. Prevention & Automated Test
- Verified in `scripts/incident_simulation.py` (Scenario 5).
