'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { AttendanceClock } from '@/components/AttendanceClock';
import { Clock, Calendar, CheckCircle2, AlertCircle, Moon, Sun, ArrowRight } from 'lucide-react';
import { AttendanceRecord, Shift } from '@/types';

export default function AttendancePage() {
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const shifts: Shift[] = [
    {
      id: 'shift-1',
      code: 'DAY-STD',
      name: 'Standard Business Day Shift',
      startTime: '09:00',
      endTime: '17:00',
      isOvernight: false,
      gracePeriodMinutes: 15,
      workHoursPerDay: 8.0,
      colorCode: '#2563EB'
    },
    {
      id: 'shift-2',
      code: 'NIGHT-OPS',
      name: 'Overnight Incident Support Shift',
      startTime: '22:00',
      endTime: '06:00',
      isOvernight: true,
      gracePeriodMinutes: 15,
      workHoursPerDay: 8.0,
      colorCode: '#7C3AED'
    }
  ];

  const attendanceLog: AttendanceRecord[] = [
    {
      id: 'att-1',
      employeeId: 'emp-201',
      employee: { firstName: 'Jordan', lastName: 'Lee', employeeNumber: 'EMP-00201' },
      date: '2026-03-24',
      checkInTime: '2026-03-24T09:02:00Z',
      checkOutTime: '2026-03-24T17:15:00Z',
      totalWorkHours: 8.22,
      regularHours: 8.0,
      overtimeHours: 0.22,
      status: 'PRESENT',
      isCorrected: false,
    },
    {
      id: 'att-2',
      employeeId: 'emp-201',
      employee: { firstName: 'Jordan', lastName: 'Lee', employeeNumber: 'EMP-00201' },
      date: '2026-03-23',
      checkInTime: '2026-03-23T09:22:00Z',
      checkOutTime: '2026-03-23T17:05:00Z',
      totalWorkHours: 7.72,
      regularHours: 7.72,
      overtimeHours: 0.0,
      status: 'LATE',
      notes: 'Traffic delay on highway',
      isCorrected: false,
    },
    {
      id: 'att-3',
      employeeId: 'emp-202',
      employee: { firstName: 'Sarah', lastName: 'Connor', employeeNumber: 'EMP-00202' },
      date: '2026-03-23',
      checkInTime: '2026-03-23T21:58:00Z',
      checkOutTime: '2026-03-24T06:02:00Z',
      totalWorkHours: 8.07,
      regularHours: 8.0,
      overtimeHours: 0.07,
      status: 'PRESENT',
      notes: 'Overnight Incident Monitoring Shift (Crossed midnight)',
      isCorrected: false,
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole="ADMINISTRATOR" />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Attendance & Shift Engine
              </h1>
              <p className="text-sm text-slate-500">
                Assessment 07: Shift rosters, overnight schedule evaluation, and attendance corrections.
              </p>
            </div>

            <button
              onClick={() => setShowCorrectionModal(true)}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              Request Attendance Correction
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AttendanceClock />
            </div>

            {/* Shift Roster Configuration */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase mb-3">
                Configured Shifts & Grace Periods
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shifts.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-800">{s.name}</span>
                      {s.isOvernight ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                          <Moon className="w-3 h-3" /> Overnight
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                          <Sun className="w-3 h-3" /> Day
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-extrabold font-mono text-slate-900">
                      {s.startTime} — {s.endTime}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Grace Period: <strong>{s.gracePeriodMinutes} mins</strong> • Standard Day: <strong>{s.workHoursPerDay} hrs</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Recent Attendance Events (Including Overnight Spans)
              </h3>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Check In</th>
                  <th className="px-6 py-3.5">Check Out</th>
                  <th className="px-6 py-3.5">Total Hours</th>
                  <th className="px-6 py-3.5">Regular / OT</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {attendanceLog.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {log.employee?.firstName} {log.employee?.lastName}
                      <span className="block text-[11px] text-slate-400 font-normal">{log.employee?.employeeNumber}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{log.date}</td>
                    <td className="px-6 py-4 font-mono">{log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                    <td className="px-6 py-4 font-mono">{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{log.totalWorkHours} hrs</td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {log.regularHours}h / <span className="text-emerald-600 font-bold">{log.overtimeHours}h OT</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.status}
                      </span>
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
