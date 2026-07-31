-- Create "tasks" table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time_slot TIME NULL,
  duration_minutes INTEGER DEFAULT 25,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  is_completed BOOLEAN DEFAULT false,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_minutes_before INTEGER NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user_id and date queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks (user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can SELECT their own tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can INSERT their own tasks
CREATE POLICY "Users can insert own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can UPDATE their own tasks
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can DELETE their own tasks
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);
