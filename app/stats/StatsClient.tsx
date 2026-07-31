'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Task } from '@/types/task';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface StatsClientProps {
  userEmail: string;
  tasks: Task[];
}

export default function StatsClient({ userEmail, tasks }: StatsClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 1. Total tasks created (all time)
  const totalTasksCount = tasks.length;

  // 2. Completion rate (% completed)
  const completedTasksCount = tasks.filter((t) => t.is_completed).length;
  const completionRate = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  // 3. Current streak (consecutive days with at least 1 completed task)
  const currentStreak = useMemo(() => {
    // Set of dates with at least 1 completed task
    const completedDates = new Set(
      tasks.filter((t) => t.is_completed && t.date).map((t) => t.date)
    );

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      if (completedDates.has(dateStr)) {
        streak++;
      } else {
        // If today has no completed task yet, don't break streak on today
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  }, [tasks]);

  // 4. Last 7 Days Completed Chart Data
  const chartData = useMemo(() => {
    const last7Days: { dateStr: string; label: string; count: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

      // Count tasks completed on this date
      const count = tasks.filter((t) => t.date === dateStr && t.is_completed).length;
      last7Days.push({ dateStr, label, count });
    }

    return last7Days;
  }, [tasks]);

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-foreground font-sans selection:bg-[#E62429] selection:text-white">
      {/* Sidebar */}
      <Sidebar
        userEmail={userEmail}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 md:pl-60 relative z-10 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="rounded-lg border border-white/10 p-2 text-foreground/70 md:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
              Productivity Analytics
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="p-6 md:p-8 space-y-8 flex-1 max-w-5xl mx-auto w-full">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Performance Stats
            </h1>
            <p className="mt-1 text-sm font-medium text-foreground/50">
              Track your focus consistency and completed task trends.
            </p>
          </div>

          {/* 3 STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-xl"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">
                Total Tasks (All Time)
              </div>
              <div className="text-4xl font-black text-white">{totalTasksCount}</div>
              <p className="mt-2 text-xs text-foreground/50">
                {completedTasksCount} completed across all days
              </p>
            </motion.div>

            {/* Completion Rate */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-xl"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">
                Completion Rate
              </div>
              <div className="text-4xl font-black text-[#E62429]">{completionRate}%</div>
              <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#E62429]"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </motion.div>

            {/* Current Streak */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-xl"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">
                Current Streak
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{currentStreak}</span>
                <span className="text-xl font-extrabold text-[#E62429]">Days 🔥</span>
              </div>
              <p className="mt-2 text-xs text-foreground/50">
                Consecutive days with at least 1 completed task
              </p>
            </motion.div>
          </div>

          {/* 7-DAY COMPLETED TASKS CHART */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-7 shadow-xl space-y-4"
          >
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Tasks Completed (Last 7 Days)
              </h2>
              <p className="text-xs text-foreground/40 mt-1">
                Daily breakdown of completed tasks over the past week
              </p>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="#F5F5F0"
                    strokeOpacity={0.3}
                    tick={{ fill: 'rgba(245,245,240,0.5)', fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#F5F5F0"
                    strokeOpacity={0.3}
                    tick={{ fill: 'rgba(245,245,240,0.5)', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#F5F5F0',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? '#E62429' : 'rgba(255,255,255,0.1)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
