'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  Award,
  BarChart3,
  FileText,
  ShieldCheck,
  Building2,
  LayoutDashboard
} from 'lucide-react';
import { Role } from '@/types';

interface SidebarProps {
  userRole?: Role;
}

export function Sidebar({ userRole = 'EMPLOYEE' }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
    { name: 'Employee Directory', href: '/employees', icon: Users, roles: ['ALL'] },
    { name: 'Attendance & Shifts', href: '/attendance', icon: Clock, roles: ['ALL'] },
    { name: 'Leave Requests', href: '/leaves', icon: CalendarDays, roles: ['ALL'] },
    { name: 'Payroll & Payslips', href: '/payroll', icon: DollarSign, roles: ['ALL'] },
    { name: 'Performance', href: '/performance', icon: Award, roles: ['ALL'] },
    { name: 'Document Vault', href: '/documents', icon: FileText, roles: ['ALL'] },
    { name: 'Workforce Analytics', href: '/analytics', icon: BarChart3, roles: ['ADMINISTRATOR', 'HR_OFFICER', 'MANAGER', 'PAYROLL_SPECIALIST'] },
    { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck, roles: ['ADMINISTRATOR'] },
  ];

  const filteredNav = navigation.filter(item => {
    if (item.roles.includes('ALL')) return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-500/30">
          P
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-white">PeopleCore</h1>
          <p className="text-xs text-blue-400 font-medium">HRMS & Workforce Platform</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
          <p className="text-xs text-slate-400">Current Role Context</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
            {userRole}
          </span>
        </div>
      </div>
    </aside>
  );
}
