'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { PayslipModal } from '@/components/PayslipModal';
import { DollarSign, ShieldAlert, CheckCircle2, FileDown, Play, Eye, Lock } from 'lucide-react';
import { PayrollPeriod, Payslip } from '@/types';

export default function PayrollPage() {
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const samplePeriod: PayrollPeriod = {
    id: 'pp-2026-02',
    periodCode: '2026-02-MONTHLY',
    name: 'February 2026 Standard Payroll',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    payDate: '2026-03-01',
    status: 'FINALIZED',
    totalGrossPay: 23500.00,
    totalNetPay: 17200.00,
    totalDeductions: 6300.00,
    _count: { payslips: 4 }
  };

  const samplePayslips: Payslip[] = [
    {
      id: 'ps-101',
      payrollPeriodId: 'pp-2026-02',
      employeeId: 'emp-201',
      employee: {
        firstName: 'Jordan',
        lastName: 'Lee',
        employeeNumber: 'EMP-00201',
        department: { id: 'ENG', code: 'ENG', name: 'Software Engineering' },
        designation: { id: 'DES-2', title: 'Senior Full Stack Engineer', departmentId: 'ENG', minSalary: 90000, maxSalary: 130000 }
      },
      payslipNumber: 'PS-2026-02-00201',
      baseSalary: 9583.33,
      grossPay: 11270.83,
      totalDeductions: 3029.58,
      netPay: 8241.25,
      paymentStatus: 'PAID',
      bankReference: 'ACH-DIRECT-DEP-9948214',
      generatedAt: '2026-03-01T00:00:00Z',
      items: [
        { id: '1', componentCode: 'BASE_SALARY', componentName: 'Basic Monthly Salary', componentType: 'EARNING', amount: 9583.33, isDeduction: false },
        { id: '2', componentCode: 'HOUSING', componentName: 'Housing Allowance (15%)', componentType: 'EARNING', amount: 1437.50, isDeduction: false },
        { id: '3', componentCode: 'TRANSPORT', componentName: 'Commuter Benefit', componentType: 'EARNING', amount: 250.00, isDeduction: false },
        { id: '4', componentCode: 'TAX_WITHHOLDING', componentName: 'Income Tax Withholding (22%)', componentType: 'DEDUCTION', amount: 2104.58, isDeduction: true },
        { id: '5', componentCode: 'PENSION_401K', componentName: '401(k) Retirement Plan (6%)', componentType: 'DEDUCTION', amount: 575.00, isDeduction: true },
        { id: '6', componentCode: 'HEALTH_INS', componentName: 'Health Insurance Premium', componentType: 'DEDUCTION', amount: 350.00, isDeduction: true },
      ]
    }
  ];

  // Domain Capstone Challenge Simulation:
  const handleTriggerPayrollRun = async () => {
    setRunning(true);
    setRunMessage(null);

    // Simulate calling API for existing finalized cycle
    setTimeout(() => {
      setRunning(false);
      // Demonstrates Idempotency enforcement
      setRunMessage({
        text: 'IDEMPOTENCY ENFORCED: Payroll for period 2026-02-MONTHLY is already FINALIZED. Re-execution was safely rejected to prevent duplicate employee payments.',
        type: 'error'
      });
    }, 700);
  };

  const handleDownloadNachaAch = () => {
    const fakeAchContent = `101 123456789 PEOPLECOR2603011200A094101PeopleCore Enterprise   PEOPLECORE HRMS        00000001\r\n5220PEOPLECORE      DISBURSEMENT        PEOPLECOREPPDDirect Dep260301260301   1123456780000001\r\n62212100035844556677889     0000824125EMP-00201       LEE, JORDAN           0123456780000001\r\n82200000010121000358000000000000000000824125PEOPLECORE                         123456780000001\r\n9000001000001000000010121000358000000000000000000824125                                       `;
    const blob = new Blob([fakeAchContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NACHA_ACH_DIRECT_DEPOSIT_${samplePeriod.periodCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole="ADMINISTRATOR" />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll Preparation & Preparation</h1>
              <p className="text-sm text-slate-500">
                Decimal-precision payroll runs, bank exports, and interactive employee payslips.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadNachaAch}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" /> Export NACHA ACH File
              </button>

              <button
                onClick={handleTriggerPayrollRun}
                disabled={running}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> {running ? 'Verifying...' : 'Execute Payroll Cycle'}
              </button>
            </div>
          </div>

          {runMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 border ${
                runMessage.type === 'error'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
              <span>{runMessage.text}</span>
            </div>
          )}

          {/* Period Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Active Pay Cycle</span>
                <h3 className="text-lg font-extrabold text-slate-900">{samplePeriod.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Period: {samplePeriod.periodCode}</p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                {samplePeriod.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Total Gross Pay</p>
                <p className="text-xl font-extrabold font-mono text-slate-900">${samplePeriod.totalGrossPay.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Total Deductions</p>
                <p className="text-xl font-extrabold font-mono text-rose-600">-${samplePeriod.totalDeductions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Disbursed Net Pay</p>
                <p className="text-xl font-extrabold font-mono text-emerald-600">${samplePeriod.totalNetPay.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Reconciled Payslips</p>
                <p className="text-xl font-extrabold font-mono text-slate-900">{samplePeriod._count?.payslips} generated</p>
              </div>
            </div>
          </div>

          {/* Payslips Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Generated Employee Payslips
              </h3>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Payslip Number</th>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Gross Pay</th>
                  <th className="px-6 py-3.5">Deductions</th>
                  <th className="px-6 py-3.5">Net Pay</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {samplePayslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{ps.payslipNumber}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {ps.employee?.firstName} {ps.employee?.lastName}
                      <span className="block text-[11px] text-slate-400 font-normal">{ps.employee?.department?.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">${Number(ps.grossPay).toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-rose-600">-${Number(ps.totalDeductions).toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono font-extrabold text-emerald-600">${Number(ps.netPay).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {ps.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedPayslip(ps)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs transition-colors"
                      >
                        Open Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PayslipModal payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
        </main>
      </div>
    </div>
  );
}
