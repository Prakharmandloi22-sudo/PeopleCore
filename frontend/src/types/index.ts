export type Role = 'ADMINISTRATOR' | 'HR_OFFICER' | 'MANAGER' | 'PAYROLL_SPECIALIST' | 'EMPLOYEE';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN';
export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'ON_LEAVE' | 'TERMINATED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PayrollStatus = 'DRAFT' | 'PROCESSING' | 'APPROVED' | 'FINALIZED' | 'PAID';
export type PayslipStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    departmentId: string;
    designationId: string;
  };
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  _count?: { employees: number };
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
  minSalary: number;
  maxSalary: number;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address?: string;
  departmentId: string;
  department?: Department;
  designationId: string;
  designation?: Designation;
  managerId?: string;
  manager?: { id: string; firstName: string; lastName: string; employeeNumber: string };
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  baseSalary: number | string;
  currency: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  user?: { email: string; role: Role; isActive: boolean };
}

export interface Shift {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  gracePeriodMinutes: number;
  workHoursPerDay: number;
  colorCode: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: { firstName: string; lastName: string; employeeNumber: string };
  shiftId?: string;
  shift?: Shift;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalWorkHours: number;
  regularHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
  isCorrected: boolean;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  annualAllowance: number;
  isPaid: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  carriedOverDays: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: { firstName: string; lastName: string; employeeNumber: string };
  leaveTypeId: string;
  leaveType?: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface PayslipItem {
  id: string;
  componentCode: string;
  componentName: string;
  componentType: 'EARNING' | 'DEDUCTION' | 'BENEFIT';
  amount: number;
  isDeduction: boolean;
}

export interface Payslip {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department?: Department;
    designation?: Designation;
  };
  payslipNumber: string;
  baseSalary: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: PayslipStatus;
  bankReference?: string;
  generatedAt: string;
  items?: PayslipItem[];
}

export interface PayrollPeriod {
  id: string;
  periodCode: string;
  name: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: PayrollStatus;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  _count?: { payslips: number };
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employee?: { firstName: string; lastName: string; employeeNumber: string };
  reviewerId: string;
  reviewer?: { firstName: string; lastName: string };
  reviewPeriod: string;
  reviewDate: string;
  overallRating: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  status: string;
}

export interface DocumentItem {
  id: string;
  employeeId: string;
  title: string;
  category: string;
  fileUrl: string;
  fileSize: number;
  checksum: string;
  isVirusScanned: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actor: { email: string; role: Role };
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  currentTotalHeadcount: number;
  activeEmployees: number;
  annualTurnoverRatePct: number;
  retentionRatePct: number;
  avgCompanyTenureMonths: number;
  monthlyTrends: Array<{
    month: string;
    startingHeadcount: number;
    newHires: number;
    departures: number;
    endingHeadcount: number;
    turnoverRatePct: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    headcount: number;
    percentageOfTotal: number;
    avgTenureMonths: number;
  }>;
  attendanceMetrics: {
    overallAttendanceRatePct: number;
    onTimeRatePct: number;
    lateRatePct: number;
    absentRatePct: number;
    totalRecordedDays: number;
  };
  leaveUtilization: Array<{
    leaveType: string;
    totalAllocatedDays: number;
    totalUsedDays: number;
    utilizationRatePct: number;
  }>;
  calculationMethodology: Record<string, string>;
}
