import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StatsClient from './StatsClient';
import { Task } from '@/types/task';

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*');

  const allTasks: Task[] = (tasks as Task[]) || [];

  return <StatsClient userEmail={user.email ?? ''} tasks={allTasks} />;
}
