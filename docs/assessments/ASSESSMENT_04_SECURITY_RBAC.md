# Assessment 04 — HR Data Security Implementation Guide

## Objective
Enforce employee/manager/HR/payroll access, salary field restrictions, secure document access, audit logs, and least privilege.

## Security Architecture

### 1. Five Enterprise RBAC Roles
- `ADMINISTRATOR`: Full administrative and security configuration access.
- `HR_OFFICER`: Employee onboarding, offboarding, department management, leave reviews.
- `MANAGER`: Team attendance, shift scheduling, direct report leave reviews, performance ratings.
- `PAYROLL_SPECIALIST`: Compensation management, payroll cycles, payslips, NACHA exports.
- `EMPLOYEE`: Self-service profile, attendance clock, personal leave applications, own payslips.

### 2. Dynamic Field-Level Salary Masking
Implemented in `backend/src/middleware/salaryMask.middleware.ts`:
- If requester is `ADMINISTRATOR` or `PAYROLL_SPECIALIST`: Full unmasked access.
- If requester is `EMPLOYEE`: Can only view their own complete salary.
- If unauthorized (e.g. employee viewing a peer or manager without financial permissions):
  - `baseSalary`: Replaced with `"***CONFIDENTIAL***"`.
  - `bankAccountNumber`: Masked to last 4 digits (e.g. `"****7889"`).
  - `bankRoutingNumber`: Replaced with `"***MASKED***"`.
  - `salaryComponents`: Replaced with empty list `[]`.

### 3. Immutable Security Audit Logging
Implemented in `backend/src/middleware/audit.middleware.ts`:
- Automatically records actor user ID, role, action, target entity, client IP address, and user agent.
- Captures critical events: `SALARY_VIEW`, `PAYROLL_RUN_FINALIZED`, `LEAVE_APPROVAL`, `DOCUMENT_UPLOAD`.

## Verification & Tests
- Automated test: `backend/tests/auth_rbac.test.ts`
- Verification script: `python scripts/incident_simulation.py` (Scenario 4)
