'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Award, Plus, Star, CheckCircle, Shield } from 'lucide-react';
import { PerformanceReview } from '@/types';

export default function PerformancePage() {
  const reviews: PerformanceReview[] = [
    {
      id: 'pr-1',
      employeeId: 'emp-201',
      employee: { firstName: 'Jordan', lastName: 'Lee', employeeNumber: 'EMP-00201' },
      reviewerId: 'emp-101',
      reviewer: { firstName: 'Marcus', lastName: 'Vance' },
      reviewPeriod: '2025-Annual',
      reviewDate: '2025-12-15',
      overallRating: 5,
      strengths: 'Outstanding API modularity, high code quality, reliable deployment execution, and excellent peer mentoring.',
      areasForImprovement: 'Expand cloud cost governance knowledge and participate more in external tech conferences.',
      goals: '1. Lead the PeopleCore decoupled Python calculation engine migration. 2. Mentor 2 junior hires.',
      status: 'COMPLETED'
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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Performance Evaluations</h1>
              <p className="text-sm text-slate-500">
                Quarterly cycles, 360-degree feedback, goal setting, and manager scorecards.
              </p>
            </div>

            <button className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto">
              <Plus className="w-4 h-4" /> New Review Cycle
            </button>
          </div>

          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {rev.employee?.firstName} {rev.employee?.lastName} — {rev.reviewPeriod} Review
                      </h3>
                      <p className="text-xs text-slate-400">
                        Reviewed by <span className="font-semibold text-slate-700">{rev.reviewer?.firstName} {rev.reviewer?.lastName}</span> on {rev.reviewDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < rev.overallRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-900 ml-1.5">{rev.overallRating}.0 / 5.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-bold text-slate-700 mb-1">Key Strengths & Competencies</p>
                    <p className="text-slate-600 leading-relaxed">{rev.strengths}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-bold text-slate-700 mb-1">Target Goals for Next Cycle</p>
                    <p className="text-slate-600 leading-relaxed">{rev.goals}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
