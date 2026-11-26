'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import { AuditLogItem } from '@/types';

export default function AuditLogsPage() {
  const auditLogs: AuditLogItem[] = [
    {
      id: 'log-1',
      actor: { email: 'admin@peoplecore.local', role: 'ADMINISTRATOR' },
      action: 'PAYROLL_RUN_FINALIZED',
      entityName: 'PayrollPeriod',
      entityId: '2026-02-MONTHLY',
      ipAddress: '127.0.0.1',
      timestamp: '2026-03-01T00:00:00Z',
      newValues: { totalEmployees: 4, totalNetPay: 17200.00 }
    },
    {
      id: 'log-2',
      actor: { email: 'manager@peoplecore.local', role: 'MANAGER' },
      action: 'LEAVE_APPROVAL',
      entityName: 'LeaveRequest',
      entityId: 'lr-1',
      ipAddress: '192.168.1.45',
      timestamp: '2026-03-20T10:05:00Z',
      newValues: { status: 'APPROVED', icsDispatched: true }
    },
    {
      id: 'log-3',
      actor: { email: 'payroll@peoplecore.local', role: 'PAYROLL_SPECIALIST' },
      action: 'SALARY_VIEW',
      entityName: 'Employee',
      entityId: 'EMP-00201',
      ipAddress: '127.0.0.1',
      timestamp: '2026-03-22T14:10:00Z'
    },
    {
      id: 'log-4',
      actor: { email: 'hr@peoplecore.local', role: 'HR_OFFICER' },
      action: 'EMPLOYEE_ONBOARD',
      entityName: 'Employee',
      entityId: 'EMP-00202',
      ipAddress: '127.0.0.1',
      timestamp: '2023-03-15T09:30:00Z'
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole="ADMINISTRATOR" />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Compliance Audit Logs</h1>
            <p className="text-sm text-slate-500">
              Assessment 04: Immutable tracking of sensitive salary views, payroll finalizations, and approvals.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Actor & Role</th>
                  <th className="px-6 py-3.5">Action Event</th>
                  <th className="px-6 py-3.5">Target Entity</th>
                  <th className="px-6 py-3.5">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{log.actor.email}</p>
                      <span className="text-[10px] font-mono text-blue-600 font-bold">{log.actor.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700">
                      {log.entityName} <span className="text-slate-400">({log.entityId})</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
