'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { AttendanceClock } from '@/components/AttendanceClock';
import {
  Users,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { User, Role } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('peoplecore_user');
    if (!rawUser) {
      // Default to demo admin if not authenticated
      setCurrentUser({
        id: 'usr-admin',
        email: 'admin@peoplecore.local',
        role: 'ADMINISTRATOR',
        isActive: true,
        employee: {
          id: 'EMP-00001',
          employeeNumber: 'EMP-00001',
          firstName: 'Alexander',
          lastName: 'Pierce',
          departmentId: 'dept-eng',
          designationId: 'des-lead'
        }
      });
    } else {
      try {
        setCurrentUser(JSON.parse(rawUser));
      } catch {
        router.push('/login');
      }
    }
  }, [router]);

  const userRole: Role = currentUser?.role || 'ADMINISTRATOR';
  const employeeName = currentUser?.employee
    ? `${currentUser.employee.firstName} ${currentUser.employee.lastName}`
    : currentUser?.email;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole={userRole} />

      <div className="flex-1 flex flex-col">
        <Navbar userEmail={currentUser?.email} userRole={userRole} employeeName={employeeName} />

        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Workforce Overview & Control
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Welcome back, <span className="font-semibold text-slate-800">{employeeName}</span>. All services operational.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Core API & Python Microservice Healthy
              </span>
            </div>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Workforce</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">184</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" /> +6 hires this quarter
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance Rate</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">97.8%</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">98.2% on-time check-in</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Approvals</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">3</p>
              <p className="text-xs text-amber-600 mt-2 font-medium">Requires manager review</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Payroll Run</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">FINALIZED</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Idempotent & Reconciled
              </div>
            </div>
          </div>

          {/* Central Grid: Attendance Clock + Activity Feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <AttendanceClock />
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase">
                  Upcoming Schedules & Leave Calendar
                </h3>
                <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
                  View Full Schedule →
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      10
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Jordan Lee — Annual Paid Leave</p>
                      <p className="text-[11px] text-slate-500">Approved by Marcus Vance • 3 Days Booked</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    APPROVED
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      N
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Sarah Connor — Overnight Incident Shift</p>
                      <p className="text-[11px] text-slate-500">10:00 PM – 06:00 AM (Next Day) • Operations Tier 1</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                    OVERNIGHT
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      $
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Monthly Payroll Preparation Cycle</p>
                      <p className="text-[11px] text-slate-500">Cut-off on 28th • NACHA ACH Direct Deposit Batch Ready</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    SCHEDULED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
