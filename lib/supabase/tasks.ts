import { createClient } from '@/lib/supabase/client';
import { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';

/**
 * Fetches all tasks for the logged-in user for a specific date (YYYY-MM-DD).
 */
export async function fetchTasksByDate(dateStr: string): Promise<Task[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('date', dateStr)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks by date:', error.message);
    return [];
  }

  return (data as Task[]) || [];
}

/**
 * Creates a new task for the authenticated user.
 */
export async function addTask(taskData: CreateTaskInput): Promise<Task | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Cannot add task: User not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        ...taskData,
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding task:', error.message);
    return null;
  }

  return data as Task;
}

/**
 * Toggles or updates the completion status of a task.
 */
export async function toggleTaskComplete(id: string, is_completed: boolean): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('tasks')
    .update({ is_completed })
    .eq('id', id);

  if (error) {
    console.error('Error toggling task completion:', error.message);
    return false;
  }

  return true;
}

/**
 * Updates any field of an existing task.
 */
export async function updateTask(id: string, updates: UpdateTaskInput): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating task:', error.message);
    return false;
  }

  return true;
}

/**
 * Deletes a task by ID.
 */
export async function deleteTask(id: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error.message);
    return false;
  }

  return true;
}
