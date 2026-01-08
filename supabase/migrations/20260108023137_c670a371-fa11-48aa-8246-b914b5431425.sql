-- Create table for task completion history (persists even after task deletion)
CREATE TABLE IF NOT EXISTS public.task_completion_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  task_title text NOT NULL,
  task_type text NOT NULL DEFAULT 'other',
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_completion_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own completion history" 
ON public.task_completion_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completion history" 
ON public.task_completion_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completion history" 
ON public.task_completion_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries by date
CREATE INDEX idx_task_completion_history_user_date 
ON public.task_completion_history (user_id, completed_at DESC);