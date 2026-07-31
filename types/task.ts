export type Priority = 'high' | 'normal' | 'low';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  time_slot: string | null; // e.g. '10:30' or '10:30:00'
  duration_minutes: number;
  priority: Priority;
  is_completed: boolean;
  reminder_enabled: boolean;
  reminder_minutes_before: number | null;
  created_at?: string;
}

export type CreateTaskInput = Omit<Task, 'id' | 'user_id' | 'created_at'>;
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>;
