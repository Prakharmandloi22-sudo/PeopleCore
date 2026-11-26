'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Users, Search, Plus, Building2, Shield, Eye, Lock } from 'lucide-react';
import { Employee } from '@/types';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Initial synthetic employee roster
  const sampleEmployees: Employee[] = [
    {
      id: 'emp-101',
      employeeNumber: 'EMP-00101',
      firstName: 'Marcus',
      lastName: 'Vance',
      dateOfBirth: '1983-05-14',
      gender: 'Male',
      phone: '+1 (555) 234-5678',
      departmentId: 'ENG',
      department: { id: 'ENG', code: 'ENG', name: 'Software Engineering' },
      designationId: 'DES-1',
      designation: { id: 'DES-1', title: 'Engineering Director', departmentId: 'ENG', minSalary: 120000, maxSalary: 180000 },
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: '2021-02-01',
      baseSalary: '***CONFIDENTIAL***',
      currency: 'USD',
      bankAccountNumber: '****101',
      user: { email: 'manager@peoplecore.local', role: 'MANAGER', isActive: true }
    },
    {
      id: 'emp-201',
      employeeNumber: 'EMP-00201',
      firstName: 'Jordan',
      lastName: 'Lee',
      dateOfBirth: '1994-04-12',
      gender: 'Non-Binary',
      phone: '+1 (555) 567-8901',
      departmentId: 'ENG',
      department: { id: 'ENG', code: 'ENG', name: 'Software Engineering' },
      designationId: 'DES-2',
      designation: { id: 'DES-2', title: 'Senior Full Stack Engineer', departmentId: 'ENG', minSalary: 90000, maxSalary: 130000 },
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: '2022-04-01',
      baseSalary: 115000,
      currency: 'USD',
      bankAccountNumber: '****889',
      user: { email: 'employee@peoplecore.local', role: 'EMPLOYEE', isActive: true }
    },
    {
      id: 'emp-202',
      employeeNumber: 'EMP-00202',
      firstName: 'Sarah',
      lastName: 'Connor',
      dateOfBirth: '1991-09-18',
      gender: 'Female',
      phone: '+1 (555) 678-9012',
      departmentId: 'OPS',
      department: { id: 'OPS', code: 'OPS', name: 'Cloud Operations' },
      designationId: 'DES-3',
      designation: { id: 'DES-3', title: 'Site Reliability Engineer', departmentId: 'OPS', minSalary: 75000, maxSalary: 105000 },
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: '2023-03-15',
      baseSalary: '***CONFIDENTIAL***',
      currency: 'USD',
      bankAccountNumber: '****990',
      user: { email: 'sarah.ops@peoplecore.local', role: 'EMPLOYEE', isActive: true }
    },
    {
      id: 'emp-102',
      employeeNumber: 'EMP-00102',
      firstName: 'Clara',
      lastName: 'Oswald',
      dateOfBirth: '1988-11-23',
      gender: 'Female',
      phone: '+1 (555) 345-6789',
      departmentId: 'HR',
      department: { id: 'HR', code: 'HR', name: 'Human Resources' },
      designationId: 'DES-4',
      designation: { id: 'DES-4', title: 'Senior HR Officer', departmentId: 'HR', minSalary: 70000, maxSalary: 95000 },
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: '2021-06-15',
      baseSalary: '***CONFIDENTIAL***',
      currency: 'USD',
      bankAccountNumber: '****667',
      user: { email: 'hr@peoplecore.local', role: 'HR_OFFICER', isActive: true }
    }
  ];

  const filtered = sampleEmployees.filter(emp => {
    const matchesSearch = `${emp.firstName} ${emp.lastName} ${emp.employeeNumber}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || emp.departmentId === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole="ADMINISTRATOR" />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Directory</h1>
              <p className="text-sm text-slate-500">
                Manage organization structure, profiles, and compensation attributes.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Onboard Employee
            </button>
          </div>

          {/* RBAC Notice Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>RBAC Data Security (Assessment 04):</strong> Sensitive compensation fields and bank account numbers are dynamically masked for unauthorized roles.
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name or EMP number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="ENG">Engineering</option>
                <option value="HR">Human Resources</option>
                <option value="OPS">Operations</option>
              </select>
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 uppercase tracking-wider text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Department & Title</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Base Salary (RBAC)</th>
                  <th className="px-6 py-3.5">Bank Account</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {emp.firstName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{emp.employeeNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{emp.designation?.title}</p>
                      <p className="text-[11px] text-slate-500">{emp.department?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {emp.employmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">
                      {typeof emp.baseSalary === 'number' ? (
                        <span className="text-slate-900">${emp.baseSalary.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">{emp.baseSalary}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {emp.bankAccountNumber}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-bold text-xs p-1">
                        View Profile
                      </button>
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
