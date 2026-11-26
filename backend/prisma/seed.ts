import { PrismaClient, Role, EmploymentType, EmploymentStatus, AttendanceStatus, ComponentType, CalculationType, PayrollStatus, PayslipStatus, DocumentCategory, DocumentAccessLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PeopleCore database with synthetic enterprise data...');

  // 1. Password hashing
  const defaultPassword = await bcrypt.hash('Password@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123456', 10);

  // 2. Clear existing data in reverse relational order
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.payslipItem.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payrollPeriod.deleteMany();
  await prisma.employeeSalaryComponent.deleteMany();
  await prisma.salaryComponent.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendanceCorrection.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.employeeShift.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // 3. Departments
  const deptEng = await prisma.department.create({
    data: { code: 'ENG', name: 'Software Engineering', description: 'Core product engineering and architecture' }
  });
  const deptHR = await prisma.department.create({
    data: { code: 'HR', name: 'Human Resources & People Ops', description: 'Talent management, employee relations, and compliance' }
  });
  const deptFin = await prisma.department.create({
    data: { code: 'FIN', name: 'Finance & Payroll', description: 'Financial accounting, compliance, and payroll disbursement' }
  });
  const deptOps = await prisma.department.create({
    data: { code: 'OPS', name: 'Cloud Operations & Support', description: '24/7 Infrastructure operations and incident monitoring' }
  });

  // 4. Designations
  const desEngLead = await prisma.designation.create({
    data: { title: 'Engineering Director / Manager', departmentId: deptEng.id, minSalary: 120000, maxSalary: 180000 }
  });
  const desSrDev = await prisma.designation.create({
    data: { title: 'Senior Full Stack Engineer', departmentId: deptEng.id, minSalary: 90000, maxSalary: 130000 }
  });
  const desJrDev = await prisma.designation.create({
    data: { title: 'Software Engineer', departmentId: deptEng.id, minSalary: 65000, maxSalary: 85000 }
  });
  const desHROfficer = await prisma.designation.create({
    data: { title: 'Senior HR Officer', departmentId: deptHR.id, minSalary: 70000, maxSalary: 95000 }
  });
  const desPayrollSpec = await prisma.designation.create({
    data: { title: 'Payroll Specialist', departmentId: deptFin.id, minSalary: 68000, maxSalary: 92000 }
  });
  const desOpsEng = await prisma.designation.create({
    data: { title: 'Site Reliability / Shift Engineer', departmentId: deptOps.id, minSalary: 75000, maxSalary: 105000 }
  });

  // 5. System Users
  const userAdmin = await prisma.user.create({
    data: { email: 'admin@peoplecore.local', passwordHash: adminPassword, role: Role.ADMINISTRATOR }
  });
  const userHR = await prisma.user.create({
    data: { email: 'hr@peoplecore.local', passwordHash: defaultPassword, role: Role.HR_OFFICER }
  });
  const userManager = await prisma.user.create({
    data: { email: 'manager@peoplecore.local', passwordHash: defaultPassword, role: Role.MANAGER }
  });
  const userPayroll = await prisma.user.create({
    data: { email: 'payroll@peoplecore.local', passwordHash: defaultPassword, role: Role.PAYROLL_SPECIALIST }
  });
  const userEmp1 = await prisma.user.create({
    data: { email: 'employee@peoplecore.local', passwordHash: defaultPassword, role: Role.EMPLOYEE }
  });
  const userEmp2 = await prisma.user.create({
    data: { email: 'sarah.ops@peoplecore.local', passwordHash: defaultPassword, role: Role.EMPLOYEE }
  });

  // 6. Employees
  // Manager Employee
  const empManager = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-00101',
      userId: userManager.id,
      firstName: 'Marcus',
      lastName: 'Vance',
      dateOfBirth: new Date('1983-05-14'),
      gender: 'Male',
      phone: '+1 (555) 234-5678',
      address: '100 Silicon Way, Tech City, CA',
      emergencyContact: 'Elena Vance (+1 555-987-6543)',
      departmentId: deptEng.id,
      designationId: desEngLead.id,
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      hireDate: new Date('2021-02-01'),
      baseSalary: 145000.00,
      bankName: 'Silicon Valley Commercial Bank',
      bankAccountNumber: '98765432101',
      bankRoutingNumber: '121000358'
    }
  });

  // Admin Employee
  const empAdmin = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-00001',
      userId: userAdmin.id,
      firstName: 'Alexander',
      lastName: 'Pierce',
      dateOfBirth: new Date('1980-01-15'),
      gender: 'Male',
      phone: '+1 (555) 100-0001',
      address: '1 Executive Plaza, Tech City, CA',
      departmentId: deptEng.id,
      designationId: desEngLead.id,
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      hireDate: new Date('2020-01-01'),
      baseSalary: 175000.00,
      bankName: 'JPMorgan Chase',
      bankAccountNumber: '11223344556',
      bankRoutingNumber: '021000021'
    }
  });

  // HR Officer Employee
  const empHR = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-00102',
      userId: userHR.id,
      firstName: 'Clara',
      lastName: 'Oswald',
      dateOfBirth: new Date('1988-11-23'),
      gender: 'Female',
      phone: '+1 (555) 345-6789',
      address: '42 Baker St, Suite 4, Tech City, CA',
      emergencyContact: 'Danny Pink (+1 555-876-5432)',
      departmentId: deptHR.id,
      designationId: desHROfficer.id,
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      hireDate: new Date('2021-06-15'),
      baseSalary: 88000.00,
      bankName: 'Bank of America',
      bankAccountNumber: '22334455667',
      bankRoutingNumber: '121000358'
    }
  });

  // Payroll Specialist Employee
  const empPayroll = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-00103',
      userId: userPayroll.id,
      firstName: 'David',
      lastName: 'Sterling',
      dateOfBirth: new Date('1985-08-30'),
      gender: 'Male',
      phone: '+1 (555) 456-7890',
      address: '77 Commerce Blvd, Tech City, CA',
      departmentId: deptFin.id,
      designationId: desPayrollSpec.id,
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      hireDate: new Date('2022-01-10'),
      baseSalary: 82000.00,
      bankName: 'Wells Fargo',
      bankAccountNumber: '33445566778',
      bankRoutingNumber: '121000248'
    }
  });

  // Standard Direct Report Employee
  const empDev = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-00201',
      userId: userEmp1.id,
      firstName: 'Jordan',
      lastName: 'Lee',
      dateOfBirth: new Date('1994-04-12'),
      gender: 'Non-Binary',
      phone: '+1 (555) 567-8901',
      address: '250 Innovation Drive, Apt 3B, Tech City, CA',
      emergencyContact: 'Morgan Lee (+1 555-765-4321)',
      departmentId: deptEng.id,
      designationId: desSrDev.id,
      managerId: empManager.id,
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      hireDate: new Date('2022-04-01'),
      baseSalary: 115000.00,
      bankName: 'Citibank',
      bankAccountNumber: '44556677889',
      bankRoutingNumber: '021000089'
    }
  });

  // Operations Shift Worker (Overnight Schedules)
  const empOps = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-00202',
      userId: userEmp2.id,
      firstName: 'Sarah',
      lastName: 'Connor',
      dateOfBirth: new Date('1991-09-18'),
      gender: 'Female',
      phone: '+1 (555) 678-9012',
      address: '88 Cyberdyne Ave, Tech City, CA',
      emergencyContact: 'John Connor (+1 555-654-3210)',
      departmentId: deptOps.id,
      designationId: desOpsEng.id,
      managerId: empManager.id,
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      hireDate: new Date('2023-03-15'),
      baseSalary: 95000.00,
      bankName: 'Silicon Valley Commercial Bank',
      bankAccountNumber: '55667788990',
      bankRoutingNumber: '121000358'
    }
  });

  // Link Managers to Departments
  await prisma.department.update({ where: { id: deptEng.id }, data: { managerId: empManager.id } });
  await prisma.department.update({ where: { id: deptHR.id }, data: { managerId: empHR.id } });
  await prisma.department.update({ where: { id: deptFin.id }, data: { managerId: empPayroll.id } });

  // 7. Shifts (Day, Overnight, Morning)
  const shiftStandard = await prisma.shift.create({
    data: {
      code: 'DAY-STD',
      name: 'Standard Day Shift (9 AM - 5 PM)',
      startTime: '09:00',
      endTime: '17:00',
      isOvernight: false,
      gracePeriodMinutes: 15,
      workHoursPerDay: 8.00,
      colorCode: '#2563EB'
    }
  });

  const shiftOvernight = await prisma.shift.create({
    data: {
      code: 'NIGHT-OPS',
      name: 'Overnight Incident Monitoring Shift (10 PM - 6 AM)',
      startTime: '22:00',
      endTime: '06:00',
      isOvernight: true,
      gracePeriodMinutes: 15,
      workHoursPerDay: 8.00,
      colorCode: '#7C3AED'
    }
  });

  // Assign Shifts
  await prisma.employeeShift.create({
    data: { employeeId: empDev.id, shiftId: shiftStandard.id, effectiveFrom: new Date('2024-01-01') }
  });
  await prisma.employeeShift.create({
    data: { employeeId: empOps.id, shiftId: shiftOvernight.id, effectiveFrom: new Date('2024-01-01') }
  });

  // 8. Leave Types
  const leaveAnnual = await prisma.leaveType.create({
    data: { code: 'ANNUAL', name: 'Annual Paid Time Off', annualAllowance: 20.0, isPaid: true, allowsCarryover: true, maxCarryoverDays: 5.0 }
  });
  const leaveSick = await prisma.leaveType.create({
    data: { code: 'SICK', name: 'Medical & Sick Leave', annualAllowance: 10.0, isPaid: true, requiresProof: true, allowsCarryover: false }
  });
  const leaveUnpaid = await prisma.leaveType.create({
    data: { code: 'UNPAID', name: 'Unpaid Leave of Absence', annualAllowance: 30.0, isPaid: false, allowsCarryover: false }
  });

  // Leave Balances
  const currentYear = new Date().getFullYear();
  for (const emp of [empDev, empOps, empManager, empHR, empPayroll]) {
    await prisma.leaveBalance.create({
      data: { employeeId: emp.id, leaveTypeId: leaveAnnual.id, year: currentYear, allocatedDays: 20.0, usedDays: 3.0, pendingDays: 0.0, carriedOverDays: 2.0 }
    });
    await prisma.leaveBalance.create({
      data: { employeeId: emp.id, leaveTypeId: leaveSick.id, year: currentYear, allocatedDays: 10.0, usedDays: 1.0, pendingDays: 0.0, carriedOverDays: 0.0 }
    });
  }

  // 9. Leave Requests
  await prisma.leaveRequest.create({
    data: {
      employeeId: empDev.id,
      leaveTypeId: leaveAnnual.id,
      startDate: new Date('2026-04-10'),
      endDate: new Date('2026-04-12'),
      totalDays: 3.0,
      reason: 'Spring family vacation and rest',
      status: LeaveStatus.APPROVED,
      approvedBy: userManager.id,
      reviewedAt: new Date('2026-03-20')
    }
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: empDev.id,
      leaveTypeId: leaveAnnual.id,
      startDate: new Date('2026-05-18'),
      endDate: new Date('2026-05-19'),
      totalDays: 2.0,
      reason: 'Personal time off for renewal',
      status: LeaveStatus.PENDING
    }
  });

  // 10. Salary Components
  const compHousing = await prisma.salaryComponent.create({
    data: { code: 'HOUSING', name: 'Housing Allowance', type: ComponentType.EARNING, calculationType: CalculationType.PERCENTAGE_OF_BASE, defaultValue: 15.0, isTaxable: true }
  });
  const compTransport = await prisma.salaryComponent.create({
    data: { code: 'TRANSPORT', name: 'Commuter Benefit Allowance', type: ComponentType.EARNING, calculationType: CalculationType.FIXED, defaultValue: 250.00, isTaxable: false }
  });
  const compHealth = await prisma.salaryComponent.create({
    data: { code: 'HEALTH_INS', name: 'Health Insurance Premium', type: ComponentType.DEDUCTION, calculationType: CalculationType.FIXED, defaultValue: 350.00, isStatutory: false }
  });
  const compPension = await prisma.salaryComponent.create({
    data: { code: 'PENSION_401K', name: 'Retirement 401(k) Employee Contribution', type: ComponentType.DEDUCTION, calculationType: CalculationType.PERCENTAGE_OF_BASE, defaultValue: 6.0, isStatutory: true }
  });
  const compTax = await prisma.salaryComponent.create({
    data: { code: 'TAX_WITHHOLDING', name: 'Federal & State Tax Withholding', type: ComponentType.DEDUCTION, calculationType: CalculationType.PERCENTAGE_OF_BASE, defaultValue: 22.0, isStatutory: true }
  });

  // Link Salary Components for empDev
  await prisma.employeeSalaryComponent.create({
    data: { employeeId: empDev.id, componentId: compHousing.id, amount: 1437.50, percentage: 15.0 }
  });
  await prisma.employeeSalaryComponent.create({
    data: { employeeId: empDev.id, componentId: compTransport.id, amount: 250.00 }
  });
  await prisma.employeeSalaryComponent.create({
    data: { employeeId: empDev.id, componentId: compHealth.id, amount: 350.00 }
  });
  await prisma.employeeSalaryComponent.create({
    data: { employeeId: empDev.id, componentId: compPension.id, amount: 575.00, percentage: 6.0 }
  });

  // 11. Attendance Records (Sample for current month)
  const today = new Date();
  const testDate1 = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 2));
  const testDate2 = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 1));

  await prisma.attendanceRecord.create({
    data: {
      employeeId: empDev.id,
      shiftId: shiftStandard.id,
      date: testDate1,
      checkInTime: new Date(testDate1.setHours(9, 2, 0)),
      checkOutTime: new Date(testDate1.setHours(17, 15, 0)),
      totalWorkHours: 8.22,
      regularHours: 8.00,
      overtimeHours: 0.22,
      status: AttendanceStatus.PRESENT,
      verificationMethod: 'WEB_PORTAL'
    }
  });

  await prisma.attendanceRecord.create({
    data: {
      employeeId: empDev.id,
      shiftId: shiftStandard.id,
      date: testDate2,
      checkInTime: new Date(testDate2.setHours(9, 20, 0)),
      checkOutTime: new Date(testDate2.setHours(17, 5, 0)),
      totalWorkHours: 7.75,
      regularHours: 7.75,
      overtimeHours: 0.00,
      status: AttendanceStatus.LATE,
      verificationMethod: 'WEB_PORTAL',
      notes: 'Traffic delay on freeway'
    }
  });

  // 12. Payroll Period & Idempotent Payslips
  const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const periodCode = `${prevYear}-${String(prevMonth).padStart(2, '0')}-MONTHLY`;

  const payrollPeriod = await prisma.payrollPeriod.create({
    data: {
      periodCode,
      name: `Monthly Payroll ${periodCode}`,
      startDate: new Date(prevYear, prevMonth - 1, 1),
      endDate: new Date(prevYear, prevMonth, 0),
      payDate: new Date(prevYear, prevMonth, 1),
      status: PayrollStatus.FINALIZED,
      totalGrossPay: 23500.00,
      totalNetPay: 17200.00,
      totalDeductions: 6300.00,
      finalizedAt: new Date(),
      finalizedBy: userPayroll.id
    }
  });

  const payslipDev = await prisma.payslip.create({
    data: {
      payrollPeriodId: payrollPeriod.id,
      employeeId: empDev.id,
      payslipNumber: `PS-${periodCode}-00201`,
      baseSalary: 9583.33,
      grossPay: 11270.83,
      totalDeductions: 3029.58,
      netPay: 8241.25,
      paymentStatus: PayslipStatus.PAID,
      bankReference: 'ACH-DIRECT-DEP-9948214',
      generatedAt: new Date()
    }
  });

  await prisma.payslipItem.createMany({
    data: [
      { payslipId: payslipDev.id, componentCode: 'BASE_SALARY', componentName: 'Basic Monthly Pay', componentType: ComponentType.EARNING, amount: 9583.33, isDeduction: false },
      { payslipId: payslipDev.id, componentCode: 'HOUSING', componentName: 'Housing Allowance', componentType: ComponentType.EARNING, amount: 1437.50, isDeduction: false },
      { payslipId: payslipDev.id, componentCode: 'TRANSPORT', componentName: 'Commuter Benefit', componentType: ComponentType.EARNING, amount: 250.00, isDeduction: false },
      { payslipId: payslipDev.id, componentCode: 'TAX_WITHHOLDING', componentName: 'Income Tax Withholding', componentType: ComponentType.DEDUCTION, amount: 2104.58, isDeduction: true },
      { payslipId: payslipDev.id, componentCode: 'PENSION_401K', componentName: '401(k) Retirement Plan', componentType: ComponentType.DEDUCTION, amount: 575.00, isDeduction: true },
      { payslipId: payslipDev.id, componentCode: 'HEALTH_INS', componentName: 'Health Insurance Premium', componentType: ComponentType.DEDUCTION, amount: 350.00, isDeduction: true },
    ]
  });

  // 13. Performance Review
  await prisma.performanceReview.create({
    data: {
      employeeId: empDev.id,
      reviewerId: empManager.id,
      reviewPeriod: '2025-Annual',
      reviewDate: new Date('2025-12-15'),
      overallRating: 5,
      strengths: 'Outstanding problem solving, clean API designs, proactive teamwork, and excellent peer mentoring.',
      areasForImprovement: 'Expand cloud cost optimization knowledge and lead more architectural RFC sessions.',
      goals: '1. Lead the PeopleCore microservice decoupled payroll engine migration. 2. Mentor 2 junior engineers.',
      status: 'COMPLETED'
    }
  });

  // 14. Documents
  await prisma.document.create({
    data: {
      employeeId: empDev.id,
      title: 'Employment Agreement & NDA (Executed)',
      category: DocumentCategory.CONTRACT,
      fileUrl: '/uploads/contracts/EMP00201_Agreement.pdf',
      fileKey: 'EMP00201_CONTRACT_2022.pdf',
      fileSize: 412500,
      mimeType: 'application/pdf',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      uploadedBy: userHR.id,
      accessLevel: DocumentAccessLevel.RESTRICTED,
      isVirusScanned: true
    }
  });

  // 15. Audit Logs
  await prisma.auditLog.create({
    data: {
      actorId: userAdmin.id,
      actorRole: Role.ADMINISTRATOR,
      action: 'SYSTEM_BOOTSTRAP',
      entityName: 'System',
      entityId: 'ROOT',
      newValues: { message: 'PeopleCore synthetic enterprise data seeded successfully.' },
      ipAddress: '127.0.0.1',
      userAgent: 'PrismaSeedEngine/1.0'
    }
  });

  console.log('PeopleCore database seeded successfully with 5 enterprise roles, departments, shifts, attendance, leaves, payroll, payslips, reviews, and documents.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
