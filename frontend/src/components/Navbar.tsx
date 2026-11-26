'use client';

import React from 'react';
import { ApiClient } from '@/lib/api';
import { LogOut, Bell, Shield, User } from 'lucide-react';
import { Role } from '@/types';

interface NavbarProps {
  userEmail?: string;
  userRole?: Role;
  employeeName?: string;
}

export function Navbar({ userEmail = 'admin@peoplecore.local', userRole = 'ADMINISTRATOR', employeeName }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-500">Workspace /</span>
        <span className="text-sm font-semibold text-slate-900">PeopleCore Global Enterprise</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Environment:</span>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            STAGING SANDBOX
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            {employeeName ? employeeName[0] : 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {employeeName || userEmail}
            </p>
            <p className="text-[11px] font-medium text-slate-500">{userRole}</p>
          </div>
        </div>

        <button
          onClick={() => ApiClient.logout()}
          className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
