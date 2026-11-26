import { Role } from '@prisma/client';
import { sanitizeEmployeeRecord } from '../src/middleware/salaryMask.middleware';

describe('Assessment 04 & 12: RBAC Security & Salary Field Masking Tests', () => {
  const sampleEmployee = {
    id: 'emp-201',
    employeeNumber: 'EMP-00201',
    firstName: 'Jordan',
    lastName: 'Lee',
    baseSalary: 115000.00,
    currency: 'USD',
    bankName: 'Citibank',
    bankAccountNumber: '44556677889',
    bankRoutingNumber: '021000089',
    salaryComponents: [
      { id: 'sc-1', amount: 1437.50 }
    ]
  };

  test('Administrator receives complete unmasked compensation and banking details', () => {
    const adminUser = {
      id: 'usr-admin',
      email: 'admin@peoplecore.local',
      role: Role.ADMINISTRATOR,
      employeeId: 'emp-00001'
    };

    const result = sanitizeEmployeeRecord(sampleEmployee, adminUser);

    expect(result.baseSalary).toBe(115000.00);
    expect(result.bankAccountNumber).toBe('44556677889');
    expect(result.bankRoutingNumber).toBe('021000089');
    expect(result.salaryComponents.length).toBe(1);
  });

  test('Payroll Specialist receives complete unmasked compensation and banking details', () => {
    const payrollUser = {
      id: 'usr-payroll',
      email: 'payroll@peoplecore.local',
      role: Role.PAYROLL_SPECIALIST,
      employeeId: 'emp-00103'
    };

    const result = sanitizeEmployeeRecord(sampleEmployee, payrollUser);

    expect(result.baseSalary).toBe(115000.00);
    expect(result.bankAccountNumber).toBe('44556677889');
  });

  test('Employee viewing another employee profile has baseSalary and bankAccount masked', () => {
    const otherEmployee = {
      id: 'usr-emp-other',
      email: 'sarah.ops@peoplecore.local',
      role: Role.EMPLOYEE,
      employeeId: 'emp-202' // Different employee ID
    };

    const result = sanitizeEmployeeRecord(sampleEmployee, otherEmployee);

    expect(result.baseSalary).toBe('***CONFIDENTIAL***');
    expect(result.bankAccountNumber).toBe('****7889'); // Only last 4 digits visible
    expect(result.bankRoutingNumber).toBe('***MASKED***');
    expect(result.salaryComponents).toEqual([]);
  });

  test('Employee viewing their OWN profile can see their own baseSalary and details', () => {
    const ownerEmployee = {
      id: 'usr-emp-jordan',
      email: 'employee@peoplecore.local',
      role: Role.EMPLOYEE,
      employeeId: 'emp-201' // Matches sampleEmployee.id
    };

    const result = sanitizeEmployeeRecord(sampleEmployee, ownerEmployee);

    expect(result.baseSalary).toBe(115000.00);
    expect(result.bankAccountNumber).toBe('44556677889');
  });
});
