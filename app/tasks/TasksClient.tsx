'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Task } from '@/types/task';
import { toggleTaskComplete, deleteTask } from '@/lib/supabase/tasks';

interface TasksClientProps {
  userEmail: string;
  initialTasks: Task[];
}

export default function TasksClient({ userEmail, initialTasks }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'completed') return task.is_completed;
      if (filter === 'pending') return !task.is_completed;
      return true;
    });
  }, [tasks, filter]);

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    filteredTasks.forEach((task) => {
      const dateKey = task.date || 'Unscheduled';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const dates = Object.keys(groupedTasks).sort((a, b) => b.localeCompare(a));

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
              All Tasks Library
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition ${
                  filter === f
                    ? 'bg-[#E62429] text-white shadow-md'
                    : 'text-foreground/50 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        {/* Body */}
        <main className="p-6 md:p-8 space-y-8 flex-1 max-w-5xl mx-auto w-full">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              All Tasks
            </h1>
            <p className="mt-1 text-sm font-medium text-foreground/50">
              Showing {filteredTasks.length} tasks ({filter} view)
            </p>
          </div>

          {dates.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-16 text-center">
              <p className="text-sm font-medium text-foreground/40">No tasks found for this filter.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {dates.map((dateStr) => (
                <section key={dateStr} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#E62429]">
                      {dateStr}
                    </h2>
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[11px] font-mono text-foreground/40">
                      {groupedTasks[dateStr].length} tasks
                    </span>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence>
                      {groupedTasks[dateStr].map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
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
                              <p className="text-xs text-foreground/40 mt-0.5">
                                {task.duration_minutes}m duration
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
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
