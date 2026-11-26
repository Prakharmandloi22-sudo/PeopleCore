# Assessment 08 — HR Third-Party Integrations Implementation Guide

## Objective
Integrate email/calendar, secure document storage, and a mock payroll/bank-file export. Do not send real payroll or banking instructions.

## Delivered Integration Services

### 1. Transactional Email & RFC 5545 iCalendar (.ics) Engine
- File: `backend/src/services/email.service.ts`
- Generates standard RFC 5545 iCalendar attachments for approved leave requests, allowing employees to add approved vacation directly to Outlook, Google Calendar, or Apple Calendar.

### 2. NACHA ACH Direct Deposit Banking Export
- File: `backend/src/services/bankExport.service.ts`
- Produces 94-character fixed-width NACHA files with File Header (Type 1), Company Batch Header (Type 5), Entry Details (Type 6), Batch Control (Type 8), and File Control (Type 9).
- Calculates entry hash and cryptographic SHA-256 fingerprint for transit integrity.

### 3. Secure Document Vault & Malware Scanning Simulation
- File: `backend/src/services/storage.service.ts`
- Securely stores employee agreements, tax forms, and IDs.
- Calculates SHA-256 integrity hash on disk and executes malware scan simulation.

## Verification & Tests
- Automated test: `backend/tests/attendance_leave.test.ts`
