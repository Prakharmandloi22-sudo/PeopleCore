# Assessment 02 — HRMS Backend APIs Implementation Guide

## Objective
Implement employee lifecycle, departments, roles, attendance, shifts, leave, payroll runs, payslips, and performance APIs.

## Technology Stack
- **Runtime**: Node.js v20+, TypeScript
- **Framework**: Express.js with modular service architecture
- **Security**: Helmet, CORS, JWT authentication, bcryptjs password hashing
- **Validation**: Zod schema validation
- **Logging**: Winston structured JSON logging with correlation request IDs (`X-Request-Id`)

## API Endpoints Delivered
- `POST /api/v1/auth/login` — User authentication and JWT access/refresh token issuance
- `POST /api/v1/auth/refresh` — Token rotation and refresh
- `GET /api/v1/auth/me` — Authenticated user identity and role context
- `GET /api/v1/employees` — Paginated directory with salary masking
- `POST /api/v1/employees` — HR employee onboarding with default leave balance allocation
- `PUT /api/v1/employees/:id` — Profile modification with audit trail
- `DELETE /api/v1/employees/:id` — Employee offboarding / termination
- `GET /api/v1/departments` — Department listings with designation hierarchies
- `POST /api/v1/attendance/check-in` — Check-in recording with shift grace period validation
- `POST /api/v1/attendance/check-out` — Check-out calculation supporting overnight shifts
- `POST /api/v1/attendance/correction` — Attendance time correction requests
- `POST /api/v1/leaves/request` — Concurrency-safe leave application with overlap prevention
- `PUT /api/v1/leaves/:id/status` — Manager leave decision with atomic balance decrement
- `POST /api/v1/payroll/runs` — Idempotent monthly payroll preparation and execution
- `POST /api/v1/payroll/export/bank` — NACHA ACH direct deposit generation with SHA-256 hash
- `POST /api/v1/documents/upload` — Secure document upload with virus scanning and checksums
- `GET /api/v1/audit-logs` — Administrative security audit log retrieval

## Verification & Testing
- Automated test files: `backend/tests/*.test.ts`
- Run: `cd backend && npm test`
