import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TodayClient from './TodayClient';
import { Task } from '@/types/task';

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('date', todayStr)
    .order('time_slot', { ascending: true, nullsFirst: false });

  const initialTasks: Task[] = (tasks as Task[]) || [];

  return <TodayClient userEmail={user.email ?? ''} initialTasks={initialTasks} />;
}
