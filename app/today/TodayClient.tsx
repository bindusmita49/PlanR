'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Task } from '@/types/task';
import { toggleTaskComplete, deleteTask } from '@/lib/supabase/tasks';

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const standardMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (standardMatch) {
    let hours = parseInt(standardMatch[1], 10);
    const minutes = parseInt(standardMatch[2], 10);
    const ampm = standardMatch[4];
    
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
    }
    return hours * 60 + minutes;
  }
  return null;
}

interface TodayClientProps {
  userEmail: string;
  initialTasks: Task[];
}

export default function TodayClient({ userEmail, initialTasks }: TodayClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'default'>('default');
  const [firedReminders, setFiredReminders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentMinutesSinceMidnight = currentHours * 60 + currentMinutes;

      setFiredReminders((prevFired) => {
        let updated = false;
        const nextFired = { ...prevFired };

        tasks.forEach((task) => {
          if (task.is_completed || !task.reminder_enabled || !task.time_slot) return;
          if (nextFired[task.id]) return;

          const taskMinutes = parseTimeToMinutes(task.time_slot);
          if (taskMinutes === null) return;

          const reminderMinutesBefore = task.reminder_minutes_before ?? 10;
          const reminderTime = taskMinutes - reminderMinutesBefore;

          if (currentMinutesSinceMidnight === reminderTime) {
            if (Notification.permission === 'granted') {
              new Notification('PlanR Task Reminder', {
                body: `"${task.title}" starts in ${reminderMinutesBefore} minutes (at ${task.time_slot})!`,
              });
              nextFired[task.id] = true;
              updated = true;
            }
          }
        });

        return updated ? nextFired : prevFired;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tasks]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleToggleComplete = async (task: Task) => {
    const nextVal = !task.is_completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: nextVal } : t))
    );
    await toggleTaskComplete(task.id, nextVal);
  };

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTask(id);
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-foreground font-sans selection:bg-[#E62429] selection:text-white">
      {/* Sidebar */}
      <Sidebar
        userEmail={userEmail}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        nextDeadlineMins={tasks.find((t) => !t.is_completed)?.duration_minutes || 25}
        nextDeadlineTitle={tasks.find((t) => !t.is_completed)?.title || "Today's Plan"}
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
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E62429]/30 bg-[#E62429]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#E62429]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E62429] animate-pulse" />
              Today&apos;s Plan
            </div>
          </div>

          <div className="text-xs font-semibold text-foreground/50 tracking-wide">
            {todayFormatted}
          </div>
        </header>

        {/* Body */}
        <main className="p-6 md:p-8 space-y-8 flex-1 max-w-5xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Today&apos;s Schedule
              </h1>
              <p className="mt-1 text-sm font-medium text-foreground/50">
                {completedCount} of {tasks.length} tasks completed today
              </p>
            </div>
          </div>

          {/* Notification Permission Warning */}
          {notificationPermission === 'denied' && (
            <div className="rounded-2xl border border-[#E62429]/30 bg-[#E62429]/10 px-4 py-3 text-sm text-white flex items-center gap-3 backdrop-blur-xl animate-in fade-in">
              <span className="text-[#E62429]">🔔</span>
              <span>
                Enable notifications to get reminders. You can do this in your browser settings.
              </span>
            </div>
          )}

          {/* Tasks List */}
          {tasks.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-16 text-center">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'rgba(230,36,41,0.1)' }}
              >
                <svg className="h-8 w-8" style={{ color: '#E62429' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">No tasks scheduled for today</h3>
              <p className="mt-1 text-sm text-foreground/40">
                Head over to the Overview page to add tasks for your day.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group flex items-center justify-between gap-4 rounded-2xl border p-4 backdrop-blur-xl transition-all ${
                      task.priority === 'high' ? 'border-l-4 border-l-[#E62429]' : ''
                    } ${
                      task.is_completed
                        ? 'border-white/5 bg-white/[0.02] opacity-60'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(task)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                          task.is_completed
                            ? 'border-[#E62429] bg-[#E62429] text-white'
                            : 'border-white/30 bg-white/5 hover:border-[#E62429]'
                        }`}
                      >
                        {task.is_completed && (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-base font-bold transition-all truncate ${
                            task.is_completed ? 'line-through text-foreground/40' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </h3>
                        <p className="text-xs text-foreground/40 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>{task.duration_minutes} mins duration</span>
                          {task.reminder_enabled && (
                            <>
                              <span>·</span>
                              <span className="text-[#E62429] font-medium flex items-center gap-1">
                                🔔 {task.reminder_minutes_before ?? 10} min before
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs text-foreground/60 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        {task.time_slot || 'Anytime'}
                      </span>

                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'high'
                            ? 'border-[#E62429]/40 bg-[#E62429]/15 text-[#E62429]'
                            : task.priority === 'normal'
                            ? 'border-blue-500/40 bg-blue-500/15 text-blue-400'
                            : 'border-gray-500/40 bg-gray-500/15 text-gray-400'
                        }`}
                      >
                        {task.priority}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-foreground/30 hover:text-[#E62429] transition rounded-lg hover:bg-white/10"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
