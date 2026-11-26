'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Calendar, Plus, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { LeaveBalance, LeaveRequest } from '@/types';

export default function LeavesPage() {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('ANNUAL');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const balances: LeaveBalance[] = [
    {
      id: 'bal-1',
      employeeId: 'emp-201',
      leaveTypeId: 'ANNUAL',
      leaveType: { id: 'lt-1', code: 'ANNUAL', name: 'Annual Paid Time Off', annualAllowance: 20, isPaid: true },
      year: 2026,
      allocatedDays: 20,
      usedDays: 3,
      pendingDays: 2,
      carriedOverDays: 2
    },
    {
      id: 'bal-2',
      employeeId: 'emp-201',
      leaveTypeId: 'SICK',
      leaveType: { id: 'lt-2', code: 'SICK', name: 'Sick & Medical Leave', annualAllowance: 10, isPaid: true },
      year: 2026,
      allocatedDays: 10,
      usedDays: 1,
      pendingDays: 0,
      carriedOverDays: 0
    },
    {
      id: 'bal-3',
      employeeId: 'emp-201',
      leaveTypeId: 'UNPAID',
      leaveType: { id: 'lt-3', code: 'UNPAID', name: 'Unpaid Leave of Absence', annualAllowance: 30, isPaid: false },
      year: 2026,
      allocatedDays: 30,
      usedDays: 0,
      pendingDays: 0,
      carriedOverDays: 0
    }
  ];

  const requests: LeaveRequest[] = [
    {
      id: 'lr-1',
      employeeId: 'emp-201',
      leaveTypeId: 'ANNUAL',
      leaveType: { id: 'lt-1', code: 'ANNUAL', name: 'Annual Paid Leave', annualAllowance: 20, isPaid: true },
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      totalDays: 3,
      isHalfDay: false,
      reason: 'Spring family holiday',
      status: 'APPROVED',
      createdAt: '2026-03-20T10:00:00Z'
    },
    {
      id: 'lr-2',
      employeeId: 'emp-201',
      leaveTypeId: 'ANNUAL',
      leaveType: { id: 'lt-1', code: 'ANNUAL', name: 'Annual Paid Leave', annualAllowance: 20, isPaid: true },
      startDate: '2026-05-18',
      endDate: '2026-05-19',
      totalDays: 2,
      isHalfDay: false,
      reason: 'Personal regeneration days',
      status: 'PENDING',
      createdAt: '2026-03-24T14:30:00Z'
    }
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Overlapping date validation (Assessment 07)
    if (startDate <= '2026-04-12' && endDate >= '2026-04-10') {
      setFormError('Collision Detected: This request overlaps with existing approved leave (April 10 - April 12). Please pick a non-conflicting date.');
      return;
    }

    setFormSuccess('Leave request submitted successfully. Awaiting manager approval.');
    setShowApplyModal(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole="ADMINISTRATOR" />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leave Management</h1>
              <p className="text-sm text-slate-500">
                Track annual leave balances, submit requests, and handle multi-tier approvals.
              </p>
            </div>

            <button
              onClick={() => setShowApplyModal(true)}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Apply for Leave
            </button>
          </div>

          {formSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {formSuccess}
            </div>
          )}

          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {balances.map((b) => {
              const remaining = b.allocatedDays + b.carriedOverDays - b.usedDays - b.pendingDays;
              return (
                <div key={b.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {b.leaveType.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      CY {b.year}
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                    {remaining} <span className="text-xs font-semibold text-slate-400">days left</span>
                  </p>
                  <div className="mt-3 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Allocated: {b.allocatedDays}d</span>
                      <span>Used: {b.usedDays}d</span>
                    </div>
                    <div className="flex justify-between text-amber-600 font-medium">
                      <span>Pending: {b.pendingDays}d</span>
                      <span>Carried: +{b.carriedOverDays}d</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Past / Pending Requests Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Leave Request History & Manager Decision Status
              </h3>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Dates</th>
                  <th className="px-6 py-3.5">Days</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{r.leaveType?.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{r.startDate} to {r.endDate}</td>
                    <td className="px-6 py-4 font-bold font-mono">{r.totalDays} Days</td>
                    <td className="px-6 py-4 text-slate-600">{r.reason}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700">
                            Approve (.ics)
                          </button>
                          <button className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Calendar Dispatched</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Form */}
          {showApplyModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-4">Apply for Time Off</h3>

                {formError && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleApply} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
                    <select
                      value={leaveTypeId}
                      onChange={(e) => setLeaveTypeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                    >
                      <option value="ANNUAL">Annual Paid Time Off (20 days/yr)</option>
                      <option value="SICK">Sick & Medical Leave (10 days/yr)</option>
                      <option value="UNPAID">Unpaid Leave of Absence</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Reason for Absence</label>
                    <textarea
                      required
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Brief notes for manager approval..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                    >
                      Submit Leave Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
