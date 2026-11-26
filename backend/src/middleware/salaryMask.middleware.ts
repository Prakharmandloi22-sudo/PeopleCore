import { Role } from '@prisma/client';
import { AuthenticatedUser } from './auth.middleware';

/**
 * Masks sensitive salary and banking data based on caller role and ownership.
 * Administrator and Payroll Specialist have full compensation visibility.
 * Employees can only view their own full data.
 * Other roles (e.g. Managers, HR viewing non-compensation listings) get masked values.
 */
export function sanitizeEmployeeRecord(employee: any, currentUser?: AuthenticatedUser) {
  if (!employee) return employee;

  const isFullAccessRole = currentUser && (
    currentUser.role === Role.ADMINISTRATOR ||
    currentUser.role === Role.PAYROLL_SPECIALIST
  );

  const isOwner = currentUser && currentUser.employeeId && currentUser.employeeId === employee.id;

  if (isFullAccessRole || isOwner) {
    return employee;
  }

  // Clone to avoid mutating original or cached objects
  const sanitized = { ...employee };

  // Mask bank details
  if (sanitized.bankAccountNumber) {
    const raw = String(sanitized.bankAccountNumber);
    sanitized.bankAccountNumber = raw.length > 4 ? `****${raw.slice(-4)}` : '****';
  }
  if (sanitized.bankRoutingNumber) {
    sanitized.bankRoutingNumber = '***MASKED***';
  }

  // Mask salary details if not authorized
  if (currentUser?.role !== Role.HR_OFFICER) {
    sanitized.baseSalary = '***CONFIDENTIAL***';
    if (sanitized.salaryComponents) {
      sanitized.salaryComponents = [];
    }
  }

  return sanitized;
}

export function sanitizeEmployeeList(employees: any[], currentUser?: AuthenticatedUser) {
  return employees.map((emp) => sanitizeEmployeeRecord(emp, currentUser));
}
