# Assessment 07 — Attendance and Leave Engine Implementation Guide

## Objective
Handle shifts, overnight schedules, time zones, holidays, overlapping leave, approval chains, corrections, and balance updates transactionally.

## Implementation Details

### 1. Shift & Overnight Schedule Engine
Implemented in `backend/src/modules/attendance/attendance.routes.ts`:
- Supports standard day shifts (e.g. 09:00 - 17:00) with configurable grace periods (15 minutes).
- Supports overnight shifts crossing midnight (e.g. 22:00 - 06:00).
- If an employee checks out in the morning without a check-in on the current date, the engine inspects yesterday's record for active overnight shift, calculating total hours, regular hours, and overtime hours.

### 2. Transactional Overlap & Concurrency-Safe Leave Engine
Implemented in `backend/src/modules/leave/leave.routes.ts`:
- **Collision Detection**: Evaluates whether `new_start <= existing_end AND new_end >= existing_start`.
- **Atomic Balance Reservation**: Moves requested days into `pendingDays` to prevent double-booking.
- **Approval & Decoupling**: Upon manager approval, decrements `pendingDays`, increments `usedDays`, and dispatches iCalendar `.ics` file.

## Verification & Tests
- Automated test: `backend/tests/attendance_leave.test.ts`
- Verification script: `python scripts/incident_simulation.py` (Scenario 3)
