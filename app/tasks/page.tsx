import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TasksClient from './TasksClient';
import { Task } from '@/types/task';

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('date', { ascending: false });

  const initialTasks: Task[] = (tasks as Task[]) || [];

  return <TasksClient userEmail={user.email ?? ''} initialTasks={initialTasks} />;
}
