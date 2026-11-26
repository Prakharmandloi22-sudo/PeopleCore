# PeopleCore HRMS — Service & Data Flow Sequences

---

## 1. Idempotent Payroll Preparation Sequence (Assessment 02, 05, 08, 15)

```mermaid
sequenceDiagram
    autonumber
    actor PayrollSpecialist as "Payroll Specialist"
    participant ExpressAPI as "Express Core API"
    participant DB as "PostgreSQL DB"
    participant PythonEngine as "FastAPI Payroll Engine"
    participant BankService as "NACHA ACH Exporter"

    PayrollSpecialist->>ExpressAPI: POST /api/v1/payroll/runs { periodCode: "2026-03-MONTHLY" }
    ExpressAPI->>DB: SELECT * FROM "PayrollPeriod" WHERE periodCode = '2026-03-MONTHLY'
    
    alt Status == FINALIZED
        ExpressAPI-->>PayrollSpecialist: 409 Conflict: Payroll already finalized & locked!
    else Status == DRAFT or New
        ExpressAPI->>DB: Query ACTIVE employees + Attendance hours + Approved leaves
        DB-->>ExpressAPI: Employee compensation profiles & attendance records
        
        loop For each employee in roster
            ExpressAPI->>PythonEngine: POST /api/v1/payroll/calculate (Decimal payload)
            PythonEngine-->>ExpressAPI: Itemized gross, proration, overtime, deductions, net pay
        end
        
        ExpressAPI->>DB: BEGIN TRANSACTION
        ExpressAPI->>DB: Upsert PayrollPeriod + Bulk Insert Payslips + Items
        ExpressAPI->>DB: COMMIT TRANSACTION
        
        ExpressAPI->>DB: INSERT INTO "AuditLog" (action: "PAYROLL_RUN_FINALIZED")
        ExpressAPI-->>PayrollSpecialist: 201 Created: Payroll finalized & payslips generated
    end

    opt Export Direct Deposit File
        PayrollSpecialist->>ExpressAPI: POST /api/v1/payroll/export/bank { periodId }
        ExpressAPI->>BankService: generateNachaAchFile(periodCode, records)
        BankService-->>ExpressAPI: 94-char fixed-width text + SHA-256 hash
        ExpressAPI-->>PayrollSpecialist: Download NACHA ACH file
    end
```

---

## 2. Attendance & Overnight Schedule Flow (Assessment 07)

```mermaid
sequenceDiagram
    autonumber
    actor Employee as "Site Reliability Engineer"
    participant ExpressAPI as "Express Attendance Route"
    participant DB as "PostgreSQL DB"

    Note over Employee, DB: 22:00 PM (Calendar Day 1) - Check In
    Employee->>ExpressAPI: POST /api/v1/attendance/check-in
    ExpressAPI->>DB: Verify active shift assignment (Night Shift: 22:00 - 06:00, isOvernight: true)
    ExpressAPI->>DB: Upsert AttendanceRecord(date: Day 1, checkInTime: 22:00, status: PRESENT)
    ExpressAPI-->>Employee: Check-in confirmed

    Note over Employee, DB: 06:15 AM (Calendar Day 2) - Check Out Across Midnight
    Employee->>ExpressAPI: POST /api/v1/attendance/check-out
    ExpressAPI->>DB: Lookup Day 2 record -> Not found
    ExpressAPI->>DB: Inspect Day 1 record -> Found active overnight shift!
    ExpressAPI->>ExpressAPI: Calculate: 06:15 - 22:00 = 8.25 hrs (8.00 regular, 0.25 overtime)
    ExpressAPI->>DB: Update AttendanceRecord(checkOutTime: 06:15, regular: 8.0, OT: 0.25)
    ExpressAPI-->>Employee: Check-out recorded successfully
```

---

## 3. Leave Request & Calendar Synchronization Flow (Assessment 07, 08)

```mermaid
sequenceDiagram
    autonumber
    actor Employee as "Employee"
    actor Manager as "Manager"
    participant ExpressAPI as "Express Leave Route"
    participant DB as "PostgreSQL DB"
    participant EmailEngine as "Email & Calendar Service"

    Employee->>ExpressAPI: POST /api/v1/leaves/request (Dates: April 10 - April 12)
    ExpressAPI->>DB: Check for overlapping approved/pending requests
    ExpressAPI->>DB: Check remaining leave balance
    ExpressAPI->>DB: Reserve pending days on balance & create LeaveRequest(status: PENDING)
    ExpressAPI-->>Employee: Leave request pending review

    Manager->>ExpressAPI: PUT /api/v1/leaves/:id/status { status: "APPROVED" }
    ExpressAPI->>DB: BEGIN TRANSACTION
    ExpressAPI->>DB: Deduct usedDays from balance, clear pendingDays
    ExpressAPI->>DB: Update LeaveRequest status: APPROVED
    ExpressAPI->>DB: COMMIT TRANSACTION

    ExpressAPI->>EmailEngine: Generate RFC 5545 iCalendar (.ics) invite
    EmailEngine-->>Employee: Send confirmation email with attached calendar event
    ExpressAPI-->>Manager: Approval processed
```
