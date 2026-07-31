import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import { Task } from '@/types/task';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch today's tasks for the logged-in user on the server
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('date', todayStr)
    .order('created_at', { ascending: false });

  const initialTasks: Task[] = (tasks as Task[]) || [];

  return <DashboardClient userEmail={user.email ?? ''} initialTasks={initialTasks} />;
}
