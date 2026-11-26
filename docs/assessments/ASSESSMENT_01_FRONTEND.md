# Assessment 01 — HRMS Frontend Implementation Guide

## Objective
Build employee self-service, HR admin, manager approvals, attendance, leave, payroll summary, payslip, and performance review interfaces.

## Technology Stack
- **Framework**: React 18, Next.js 14 App Router, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State & Data**: TanStack Query & REST ApiClient (`frontend/src/lib/api.ts`)

## Delivered Interfaces
1. **Employee Self-Service & Directory** (`frontend/src/app/employees/page.tsx`):
   - Comprehensive employee roster with name, department, role, and status.
   - Dynamic RBAC salary masking: unauthorized roles see `***CONFIDENTIAL***` and `****1234`.
2. **Attendance & Live Time Clock** (`frontend/src/app/attendance/page.tsx`):
   - Real-time digital clock tracking check-in / check-out with grace period enforcement.
   - Support for day shifts and overnight shifts (crossing midnight).
   - Attendance correction submission workflow.
3. **Leave Management & Entitlements** (`frontend/src/app/leaves/page.tsx`):
   - Visual balance cards (Annual, Sick, Unpaid) showing allocated, used, and pending days.
   - Overlap collision detection modal.
   - Manager approval action buttons.
4. **Payroll Preparation & Payslips** (`frontend/src/app/payroll/page.tsx`):
   - Monthly payroll cycles with status badges (`FINALIZED`, `PROCESSING`).
   - Idempotency guard trigger: Re-running a finalized cycle provides immediate defensive user feedback.
   - NACHA ACH Direct Deposit file export button.
5. **Interactive Payslip Modal** (`frontend/src/components/PayslipModal.tsx`):
   - Itemized earnings (Basic, Housing, Transport) and statutory deductions (Taxes, 401k, Health).
   - Printable formatted payslip.
6. **Workforce Intelligence** (`frontend/src/app/analytics/page.tsx`):
   - 12-month headcount trends, turnover rate, retention, and department breakdown.
7. **Security Audit Log Explorer** (`frontend/src/app/audit-logs/page.tsx`):
   - Immutable security log table for administrators.

## Verification & Testing
- To run locally: `cd frontend && npm run dev`
- Open `http://localhost:3000` to interact with all dashboards.
