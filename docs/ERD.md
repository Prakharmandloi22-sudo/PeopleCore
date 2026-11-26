# PeopleCore HRMS — Database Entity-Relationship Diagram (ERD)
**Assessment 03 | Technical Skills Evaluation Cohort**

---

## 1. Complete Database Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o| Employee : "has profile"
    User ||--o{ AuditLog : "executes"

    Department ||--o{ Employee : "employs"
    Department ||--o{ Designation : "contains"
    Designation ||--o{ Employee : "assigned to"

    Employee ||--o{ Employee : "manages"
    Employee ||--o{ EmployeeShift : "scheduled on"
    Shift ||--o{ EmployeeShift : "assigned via"

    Employee ||--o{ AttendanceRecord : "clocks"
    Shift ||--o{ AttendanceRecord : "governs"
    AttendanceRecord ||--o{ AttendanceCorrection : "subject to"

    LeaveType ||--o{ LeaveBalance : "categorizes"
    Employee ||--o{ LeaveBalance : "holds"
    LeaveType ||--o{ LeaveRequest : "applies for"
    Employee ||--o{ LeaveRequest : "submits"

    Employee ||--o{ EmployeeSalaryComponent : "receives"
    SalaryComponent ||--o{ EmployeeSalaryComponent : "configures"

    PayrollPeriod ||--o{ Payslip : "contains"
    Employee ||--o{ Payslip : "receives"
    Payslip ||--o{ PayslipItem : "itemizes"

    Employee ||--o{ PerformanceReview : "subject of"
    Employee ||--o{ Document : "owns"

    User {
        string id PK
        string email UK
        string passwordHash
        string role
        boolean isActive
        datetime lastLoginAt
    }

    Employee {
        string id PK
        string employeeNumber UK
        string userId FK
        string firstName
        string lastName
        string departmentId FK
        string designationId FK
        string managerId FK
        decimal baseSalary
        string bankAccountNumber
        string bankRoutingNumber
    }

    AttendanceRecord {
        string id PK
        string employeeId FK
        string shiftId FK
        date date UK
        datetime checkInTime
        datetime checkOutTime
        decimal totalWorkHours
        decimal overtimeHours
        string status
        boolean isCorrected
    }

    LeaveBalance {
        string id PK
        string employeeId FK
        string leaveTypeId FK
        int year UK
        decimal allocatedDays
        decimal usedDays
        decimal pendingDays
        decimal carriedOverDays
    }

    PayrollPeriod {
        string id PK
        string periodCode UK
        string name
        date startDate
        date endDate
        date payDate
        string status
        decimal totalGrossPay
        decimal totalNetPay
    }

    Payslip {
        string id PK
        string payrollPeriodId FK
        string employeeId FK
        string payslipNumber UK
        decimal baseSalary
        decimal grossPay
        decimal totalDeductions
        decimal netPay
        string paymentStatus
    }
```

---

## 2. Critical Idempotency & Concurrency Constraints

1. **Payslip Idempotency**:
   ```sql
   CREATE UNIQUE INDEX "Payslip_payrollPeriodId_employeeId_key" 
   ON "Payslip"("payrollPeriodId", "employeeId");
   ```
   *Guarantees*: An employee can never have duplicate payslips generated for the same payroll period, preventing double disbursement.

2. **Daily Attendance Uniqueness**:
   ```sql
   CREATE UNIQUE INDEX "AttendanceRecord_employeeId_date_key" 
   ON "AttendanceRecord"("employeeId", "date");
   ```
   *Guarantees*: An employee cannot clock in twice on the same day without an explicit correction request.

3. **Annual Leave Entitlement Balance Uniqueness**:
   ```sql
   CREATE UNIQUE INDEX "LeaveBalance_employeeId_leaveTypeId_year_key" 
   ON "LeaveBalance"("employeeId", "leaveTypeId", "year");
   ```
   *Guarantees*: Exactly one balance ledger entry exists per leave category per employee per calendar year.
