# Assessment 03 — HR Database Model Implementation Guide

## Objective
Design employees, reporting relationships, salary components, attendance events, leave balances, payroll periods, deductions, and payslip records.

## Technology Stack
- **Database**: PostgreSQL 16
- **ORM / Schema Engine**: Prisma ORM with native migrations
- **Migration Script**: `backend/prisma/migrations/20260301000000_init/migration.sql`
- **Synthetic Data Seed**: `backend/prisma/seed.ts`

## Key Data Entities
- **User & Employee**: Self-referencing manager hierarchy (`managerId`), personal details, sensitive compensation attributes.
- **Department & Designation**: Organization structure with salary bracket constraints (`minSalary`, `maxSalary`).
- **Shift & EmployeeShift**: Daily and overnight shift timetables with grace periods.
- **AttendanceRecord & Correction**: Check-in/out timestamps, regular and overtime hours, correction reviews.
- **LeaveType, LeaveBalance & LeaveRequest**: Multi-category leave tracking, carryover rules, annual entitlements.
- **SalaryComponent & EmployeeSalaryComponent**: Configurable earnings and deductions (fixed vs percentage of base).
- **PayrollPeriod, Payslip & PayslipItem**: Historical payroll runs, gross-to-net calculations, line-item breakdowns.
- **PerformanceReview**: Ratings (1-5), competencies, and developmental goals.
- **Document**: Encrypted storage keys, categories, access levels, and SHA-256 integrity hashes.
- **AuditLog**: Immutable security event logs.

## Integrity Guarantees & Constraints
- `@@unique([payrollPeriodId, employeeId])`: Enforces idempotency preventing duplicate payslips.
- `@@unique([employeeId, date])`: Prevents double clock-ins on the same workday.
- `@@unique([employeeId, leaveTypeId, year])`: Enforces exact balance ledger tracking per year.

## Verification
- Seed execution: `cd backend && npx prisma db seed`
- SQL migration review: `backend/prisma/migrations/20260301000000_init/migration.sql`
