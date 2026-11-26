'use client';

import React from 'react';
import { Payslip } from '@/types';
import { X, Printer, Download, CheckCircle, Shield } from 'lucide-react';

interface PayslipModalProps {
  payslip: Payslip | null;
  onClose: () => void;
}

export function PayslipModal({ payslip, onClose }: PayslipModalProps) {
  if (!payslip) return null;

  const earnings = payslip.items?.filter(item => !item.isDeduction) || [];
  const deductions = payslip.items?.filter(item => item.isDeduction) || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
              P
            </div>
            <div>
              <h2 className="text-lg font-bold">Official Salary Payslip</h2>
              <p className="text-xs text-blue-300 font-mono">{payslip.payslipNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Employee & Pay Period Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Employee</p>
              <p className="font-bold text-slate-800">
                {payslip.employee ? `${payslip.employee.firstName} ${payslip.employee.lastName}` : 'N/A'}
              </p>
              <p className="text-slate-500 font-mono">{payslip.employee?.employeeNumber}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Department</p>
              <p className="font-bold text-slate-800">{payslip.employee?.department?.name || 'Engineering'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Payment Status</p>
              <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle className="w-3 h-3" /> {payslip.paymentStatus}
              </span>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Disbursement Ref</p>
              <p className="font-mono text-slate-700 font-semibold truncate">{payslip.bankReference || 'ACH-DIRECT-DEP'}</p>
            </div>
          </div>

          {/* Itemized Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Earnings</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {earnings.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 text-xs">
                    <span className="text-slate-700 font-medium">{e.componentName}</span>
                    <span className="font-mono font-bold text-slate-900">${Number(e.amount).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-2.5 bg-blue-50/50 text-xs font-bold text-blue-900">
                  <span>Gross Pay</span>
                  <span className="font-mono">${Number(payslip.grossPay).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Deductions</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {deductions.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 text-xs">
                    <span className="text-slate-700 font-medium">{d.componentName}</span>
                    <span className="font-mono font-bold text-rose-600">-${Number(d.amount).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 text-xs font-bold text-rose-900">
                  <span>Total Deductions</span>
                  <span className="font-mono">-${Number(payslip.totalDeductions).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Highlight Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-lg shadow-blue-600/20">
            <div>
              <p className="text-xs text-blue-100 font-semibold uppercase tracking-wider">Net Take-Home Pay</p>
              <p className="text-3xl font-extrabold font-mono tracking-tight mt-0.5">
                ${Number(payslip.netPay).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                USD
              </span>
              <p className="text-[11px] text-blue-100 mt-1">Computed via Python Decimal Engine</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <Printer className="w-4 h-4" /> Print Payslip
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
