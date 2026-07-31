'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types/task';
import { fetchTasksByDate, toggleTaskComplete } from '@/lib/supabase/tasks';

interface CalendarCardProps {
  /** Map of date strings 'YYYY-MM-DD' -> boolean indicating if tasks exist on that date */
  taskDatesMap?: Record<string, boolean>;
  onDateSelect?: (dateStr: string) => void;
}

export default function CalendarCard({ taskDatesMap = {}, onDateSelect }: CalendarCardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Date calculation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // First day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Load tasks for a selected date
  const handleCellClick = useCallback(async (dayNum: number) => {
    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;

    setSelectedDateStr(dateStr);
    if (onDateSelect) onDateSelect(dateStr);

    setIsLoadingTasks(true);
    setIsModalOpen(true);
    const tasks = await fetchTasksByDate(dateStr);
    setSelectedTasks(tasks);
    setIsLoadingTasks(false);
  }, [year, month, onDateSelect]);

  const handleToggleTaskInModal = async (task: Task) => {
    const nextVal = !task.is_completed;
    setSelectedTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: nextVal } : t))
    );
    await toggleTaskComplete(task.id, nextVal);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar cells generation
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyPadding = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide">{monthName}</h3>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="rounded-lg p-1.5 text-foreground/50 hover:bg-white/10 hover:text-white transition"
            aria-label="Previous month"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg p-1.5 text-foreground/50 hover:bg-white/10 hover:text-white transition"
            aria-label="Next month"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-foreground/40">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {emptyPadding.map((_, idx) => (
          <div key={`empty-${idx}`} className="h-8 w-8" />
        ))}

        {daysArray.map((dayNum) => {
          const paddedMonth = String(month + 1).padStart(2, '0');
          const paddedDay = String(dayNum).padStart(2, '0');
          const cellDateStr = `${year}-${paddedMonth}-${paddedDay}`;

          const isToday = cellDateStr === todayStr;
          const isSelected = cellDateStr === selectedDateStr;
          const hasTask = Boolean(taskDatesMap[cellDateStr]);

          return (
            <button
              key={dayNum}
              onClick={() => handleCellClick(dayNum)}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                isToday
                  ? 'bg-[#E62429] text-white shadow-md shadow-[#E62429]/40 font-extrabold'
                  : isSelected
                  ? 'border border-[#E62429]/60 bg-[#E62429]/20 text-white'
                  : 'text-foreground/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {dayNum}

              {/* Red Dot Indicator if tasks exist on this date */}
              {hasTask && !isToday && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#E62429]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Task Modal for Selected Date */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141414]/95 p-6 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div>
                <h4 className="text-base font-bold text-white">
                  Tasks for {selectedDateStr}
                </h4>
                <p className="text-xs text-foreground/40">
                  {selectedTasks.length} task(s) scheduled
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-foreground/40 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingTasks ? (
              <div className="py-8 text-center text-xs text-[#E62429] animate-pulse font-medium">
                Loading tasks...
              </div>
            ) : selectedTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-foreground/40">
                No tasks scheduled for this date.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskInModal(task)}
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          task.is_completed
                            ? 'border-[#E62429] bg-[#E62429] text-white'
                            : 'border-white/30 bg-white/5'
                        }`}
                      >
                        {task.is_completed && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>

                      <span
                        className={`truncate text-xs font-semibold ${
                          task.is_completed ? 'line-through text-foreground/40' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-foreground/50 shrink-0">
                      {task.time_slot || 'Anytime'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
