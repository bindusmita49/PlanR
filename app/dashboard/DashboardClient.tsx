'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import CalendarCard from '@/components/CalendarCard';
import { Task, Priority } from '@/types/task';
import { fetchTasksByDate, addTask, toggleTaskComplete, deleteTask } from '@/lib/supabase/tasks';

interface DashboardClientProps {
  userEmail: string;
  initialTasks?: Task[];
}

export default function DashboardClient({ userEmail, initialTasks = [] }: DashboardClientProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('10:30 AM');
  const [newDuration, setNewDuration] = useState(25);
  const [newPriority, setNewPriority] = useState<Priority>('normal');
  const [newReminderEnabled, setNewReminderEnabled] = useState(false);
  const [newReminderMinutes, setNewReminderMinutes] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);
  const [showFlash, setShowFlash] = useState<boolean>(false);

  // Quick Add State
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const loadTasks = useCallback(async (date: string) => {
    setIsLoading(true);
    const fetched = await fetchTasksByDate(date);
    setTasks(fetched);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (initialTasks.length > 0 && selectedDate === todayStr) {
      setTasks(initialTasks);
    } else {
      loadTasks(selectedDate);
    }
  }, [selectedDate, initialTasks, todayStr, loadTasks]);

  // Compute map of dates that have tasks
  const taskDatesMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    tasks.forEach((t) => {
      if (t.date) map[t.date] = true;
    });
    return map;
  }, [tasks]);

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const pendingTasks = totalTasks - completedTasks;
  // Compute active task (highest priority incomplete task, sorted by time_slot)
  const activeTask = useMemo(() => {
    const incomplete = tasks.filter((t) => !t.is_completed);
    if (incomplete.length === 0) return null;

    const parseTime = (timeStr: string | null) => {
      if (!timeStr) return 9999;
      const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return 9999;
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    };

    return [...incomplete].sort((a, b) => {
      const priorityWeight = { high: 3, normal: 2, low: 1 };
      const aWeight = priorityWeight[a.priority] || 2;
      const bWeight = priorityWeight[b.priority] || 2;

      if (aWeight !== bWeight) {
        return bWeight - aWeight;
      }
      return parseTime(a.time_slot) - parseTime(b.time_slot);
    })[0];
  }, [tasks]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    if (!activeTask) return;
    setTimerRunning((prev) => !prev);
    setTimerCompleted(false);
    setShowFlash(false);
  };

  const handleResetTimer = () => {
    if (!activeTask) return;
    setTimerSeconds(activeTask.duration_minutes * 60);
    setTimerRunning(false);
    setTimerCompleted(false);
    setShowFlash(false);
  };

  const handleMarkActiveTaskDone = async (task: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: true } : t))
    );
    setTimerCompleted(false);
    setShowFlash(false);

    const success = await toggleTaskComplete(task.id, true);
    if (!success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: false } : t))
      );
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    const title = quickAddTitle.trim();
    setQuickAddTitle('');

    const createdTask = await addTask({
      title,
      date: selectedDate,
      time_slot: null,
      duration_minutes: 25,
      priority: 'normal',
      is_completed: false,
      reminder_enabled: false,
      reminder_minutes_before: null,
    });

    if (createdTask) {
      setTasks((prev) => [createdTask, ...prev]);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Sync/Reset focus timer when activeTask changes
  useEffect(() => {
    if (activeTask) {
      if (timerTaskId !== activeTask.id && !timerRunning) {
        setTimerSeconds(activeTask.duration_minutes * 60);
        setTimerTaskId(activeTask.id);
        setTimerCompleted(false);
        setShowFlash(false);
      }
    } else {
      setTimerSeconds(0);
      setTimerTaskId(null);
      setTimerRunning(false);
      setTimerCompleted(false);
      setShowFlash(false);
    }
  }, [activeTask, timerTaskId, timerRunning]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setTimerCompleted(true);
            setShowFlash(true);

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('PlanR Focus Session', {
                body: `Focus session complete for "${activeTask?.title}"!`,
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds, activeTask]);

  const handleToggleComplete = async (task: Task) => {
    const nextCompleted = !task.is_completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: nextCompleted } : t))
    );

    const success = await toggleTaskComplete(task.id, nextCompleted);
    if (!success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: task.is_completed } : t))
      );
    }
  };

  const handleDeleteTask = async (id: string) => {
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));

    const success = await deleteTask(id);
    if (!success) {
      setTasks(previousTasks);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const createdTask = await addTask({
      title: newTitle.trim(),
      date: selectedDate,
      time_slot: newTimeSlot.trim() || null,
      duration_minutes: Number(newDuration) || 25,
      priority: newPriority,
      is_completed: false,
      reminder_enabled: newReminderEnabled,
      reminder_minutes_before: newReminderEnabled ? Number(newReminderMinutes) : null,
    });

    if (createdTask) {
      setTasks((prev) => [createdTask, ...prev]);
      setNewTitle('');
      setNewTimeSlot('10:30 AM');
      setNewDuration(25);
      setNewPriority('normal');
      setNewReminderEnabled(false);
      setIsModalOpen(false);
    }

    setIsSubmitting(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-foreground font-sans selection:bg-[#E62429] selection:text-white">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-[#E62429]/[0.06] blur-[150px]" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full bg-[#E62429]/[0.04] blur-[140px]" />
      </div>

      {/* ── 1. REUSABLE SIDEBAR ── */}
      <Sidebar
        userEmail={userEmail}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        nextDeadlineMins={activeTask ? activeTask.duration_minutes : 25}
        nextDeadlineTitle={activeTask ? activeTask.title : 'Focus Mode'}
      />

      {/* ── 2. MAIN CONTENT AREA ── */}
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
              Day Planner · Supabase Connected
            </div>
          </div>

          <div className="text-xs font-semibold text-foreground/50 tracking-wide">
            {todayFormatted}
          </div>
        </header>

        {/* Main Body */}
        <main className="p-6 md:p-8 space-y-8 flex-1 max-w-6xl mx-auto w-full">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-snug">
              Make today&apos;s plan count.
            </h1>
            <p className="mt-1 text-sm font-medium text-foreground/50">
              Focus mode active. You have <span className="text-[#E62429] font-bold">{pendingTasks}</span> tasks remaining today.
            </p>
          </div>

          {/* HERO SECTION (Hero Card + Side Glass Stat) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* HERO CARD */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`lg:col-span-2 relative overflow-hidden rounded-3xl border transition-all duration-500 ${
                showFlash 
                  ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/20 via-[#0b1812]/80 to-[#0A0A0A]/90 shadow-[0_0_50px_rgba(16,185,129,0.25)]' 
                  : 'border-[#E62429]/30 bg-gradient-to-br from-[#E62429]/20 via-[#180809]/80 to-[#0A0A0A]/90 shadow-[0_0_50px_rgba(230,36,41,0.15)]'
              } backdrop-blur-2xl p-7 flex flex-col justify-between min-h-[220px]`}
            >
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#E62429]/20 blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    timerCompleted 
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400' 
                      : 'border-[#E62429]/40 bg-[#E62429]/20 text-[#E62429]'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      timerCompleted 
                        ? 'bg-emerald-400' 
                        : 'bg-[#E62429] animate-ping'
                    }`} />
                    {timerCompleted 
                      ? 'Session Complete!' 
                      : timerRunning 
                        ? 'Session Active' 
                        : activeTask 
                          ? `Up Next · ${activeTask.duration_minutes}m Focus` 
                          : 'Focus'}
                  </span>
                  <span className="text-xs font-mono text-foreground/60 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    {activeTask?.time_slot || 'Today'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {activeTask ? activeTask.title : 'All tasks completed for today! 🎉'}
                </h2>

                {activeTask && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="text-4xl sm:text-5xl font-black text-white tracking-wider font-mono">
                      {formatTime(timerSeconds)}
                    </div>
                    {(timerRunning || timerSeconds < activeTask.duration_minutes * 60) && (
                      <button
                        type="button"
                        onClick={handleResetTimer}
                        title="Reset Timer"
                        className="p-2 rounded-full border border-white/10 hover:border-white/20 bg-white/5 text-foreground/60 hover:text-white transition active:scale-95 animate-in fade-in zoom-in-95"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-xs text-foreground/60 font-medium">
                  {timerCompleted 
                    ? '🎉 Focus session finished! Ready to check it off?' 
                    : activeTask 
                      ? `Duration: ${activeTask.duration_minutes} mins` 
                      : 'Great job!'}
                </div>

                <div className="flex items-center gap-3">
                  {timerCompleted ? (
                    <>
                      <button
                        type="button"
                        onClick={handleResetTimer}
                        className="rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2 text-xs font-bold transition-all duration-200 active:scale-[0.97]"
                      >
                        Reset Timer
                      </button>
                      <button
                        type="button"
                        onClick={() => activeTask && handleMarkActiveTaskDone(activeTask)}
                        className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 text-xs font-bold transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.97]"
                      >
                        Mark Done ✓
                      </button>
                    </>
                  ) : activeTask ? (
                    <button
                      type="button"
                      onClick={handleToggleTimer}
                      className="rounded-full bg-[#0A0A0A]/90 hover:bg-[#E62429] text-white border border-white/10 px-5 py-2 text-xs font-bold transition-all duration-200 hover:shadow-lg hover:shadow-[#E62429]/30 active:scale-[0.97]"
                    >
                      {timerRunning ? 'Pause Session' : timerSeconds < activeTask.duration_minutes * 60 ? 'Resume Session' : 'Start Focus Session →'}
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>

            {/* SIDE GLASS STAT CARD */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-7 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">
                  Focus Completion
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{completedTasks}</span>
                  <span className="text-lg font-bold text-[#E62429]">/ {totalTasks} Tasks</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground/50">Completion Rate</span>
                  <span className="text-foreground">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#E62429] transition-all duration-500"
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── CALENDAR & QUEUE GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* 3. TODAY'S QUEUE SECTION (2 Cols) */}
            <section className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                    Today&apos;s Queue
                  </h2>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-foreground/70">
                    {tasks.length}
                  </span>
                  {isLoading && (
                    <span className="text-xs text-[#E62429] animate-pulse">Syncing...</span>
                  )}
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E62429]/40 bg-[#E62429]/15 px-3.5 py-1.5 text-xs font-semibold text-[#E62429] transition-all hover:bg-[#E62429] hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Task
                </button>
              </div>

              {/* Quick Add Mini Input */}
              <form onSubmit={handleQuickAdd} className="relative z-10 w-full">
                <input
                  type="text"
                  placeholder="⚡ Quick Add Task for today... (Press Enter)"
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-5 py-3.5 text-sm text-white placeholder-foreground/30 outline-none focus:border-[#E62429]/50 focus:ring-1 focus:ring-[#E62429]/50 focus:bg-white/[0.05] transition-all"
                />
              </form>

              {/* Task Cards */}
              {tasks.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-12 text-center">
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: 'rgba(230,36,41,0.1)' }}
                  >
                    <svg className="h-7 w-7" style={{ color: '#E62429' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-foreground/60">No tasks in your queue right now.</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 rounded-xl px-4 py-2 text-xs font-semibold text-white transition"
                    style={{ background: '#E62429' }}
                  >
                    + Add First Task
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ scale: 1.015 }}
                        transition={{ duration: 0.2 }}
                        className={`group relative rounded-2xl border backdrop-blur-xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 ${
                          task.priority === 'high' ? 'border-l-4 border-l-[#E62429]' : ''
                        } ${
                          task.is_completed
                            ? 'border-white/5 bg-white/[0.02] opacity-60'
                            : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20 hover:shadow-xl'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleComplete(task)}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
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

                              <div className="mt-1 flex items-center gap-2 text-xs text-foreground/40">
                                <span>{task.duration_minutes}m duration</span>
                                {task.reminder_enabled && (
                                  <>
                                    <span>·</span>
                                    <span className="text-[#E62429] font-medium">
                                      🔔 {task.reminder_minutes_before ?? 10} min before
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-foreground/30 hover:text-[#E62429] transition rounded-lg hover:bg-white/10"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                          <span className="font-mono text-foreground/50">{task.time_slot || 'Anytime'}</span>
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
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* 4. CALENDAR COMPONENT CARD (1 Col) */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                Month Calendar
              </h2>
              <CalendarCard taskDatesMap={taskDatesMap} onDateSelect={(d) => setSelectedDate(d)} />
            </div>
          </div>

          {/* ── 5. BOTTOM STATS ROW ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                  Daily Progress
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">{completedTasks} Done</span>
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#E62429]"
                  style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                  Next Scheduled
                </div>
                <p className="mt-2 text-sm font-bold text-white truncate">
                  {tasks.find((t) => !t.is_completed)?.title || 'No upcoming tasks'}
                </p>
              </div>
              <div className="mt-2 text-xs font-mono text-[#E62429]">
                {tasks.find((t) => !t.is_completed)?.time_slot || 'Free slot'}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                  Supabase Status
                </div>
                <p className="mt-2 text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live Sync Ready
                </p>
              </div>
              <div className="mt-2 text-xs text-foreground/50">
                Connected to public.tasks
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── ADD TASK MODAL ── */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141414]/95 p-7 shadow-2xl backdrop-blur-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-white">Add Task (Supabase)</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-foreground/40 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Design review meeting"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-foreground/30 outline-none focus:border-[#E62429] focus:ring-1 focus:ring-[#E62429]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-foreground/30 outline-none focus:border-[#E62429]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    min={5}
                    max={240}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#E62429]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#E62429]"
                >
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Set Reminder</div>
                  <div className="text-[10px] text-foreground/50">Send alert before task time</div>
                </div>
                <input
                  type="checkbox"
                  checked={newReminderEnabled}
                  onChange={(e) => setNewReminderEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 accent-[#E62429]"
                />
              </div>

              {newReminderEnabled && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                    Remind me
                  </label>
                  <select
                    value={newReminderMinutes}
                    onChange={(e) => setNewReminderMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#E62429]"
                  >
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                  </select>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-foreground/70 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#E62429' }}
                >
                  {isSubmitting ? 'Saving...' : 'Save to Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
