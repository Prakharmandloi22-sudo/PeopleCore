'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Clock, CheckCircle2, Moon, Sun, AlertTriangle } from 'lucide-react';

interface AttendanceClockProps {
  onClockStatusChange?: () => void;
}

export function AttendanceClock({ onClockStatusChange }: AttendanceClockProps) {
  const [time, setTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await ApiClient.checkIn('Web Clock-in Portal');
      setIsCheckedIn(true);
      setMessage({ text: 'Clock-in recorded successfully!', type: 'success' });
      if (onClockStatusChange) onClockStatusChange();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await ApiClient.checkOut();
      setIsCheckedIn(false);
      setMessage({ text: 'Clock-out recorded successfully!', type: 'success' });
      if (onClockStatusChange) onClockStatusChange();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Live Time Tracking</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" /> General Shift (9 AM - 5 PM)
          </span>
        </div>

        <div className="my-3 text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{time || '--:--:--'}</p>
          <p className="text-xs text-slate-500 mt-1">Local Machine Timezone</p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium mb-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={handleCheckIn}
          disabled={loading || isCheckedIn}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-sm ${
            isCheckedIn
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
          }`}
        >
          {loading ? 'Processing...' : 'Clock In'}
        </button>
        <button
          onClick={handleCheckOut}
          disabled={loading}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm shadow-slate-900/20"
        >
          {loading ? 'Processing...' : 'Clock Out'}
        </button>
      </div>
    </div>
  );
}
