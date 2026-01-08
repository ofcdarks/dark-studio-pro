-- Create table for Pomodoro state persistence
CREATE TABLE public.pomodoro_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  time_left INTEGER NOT NULL DEFAULT 1500,
  session_type TEXT NOT NULL DEFAULT 'work',
  completed_sessions INTEGER NOT NULL DEFAULT 0,
  is_running BOOLEAN NOT NULL DEFAULT false,
  work_duration INTEGER NOT NULL DEFAULT 25,
  break_duration INTEGER NOT NULL DEFAULT 5,
  long_break_duration INTEGER NOT NULL DEFAULT 15,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.pomodoro_state ENABLE ROW LEVEL SECURITY;

-- Users can view their own state
CREATE POLICY "Users can view their own pomodoro state"
ON public.pomodoro_state
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own state
CREATE POLICY "Users can insert their own pomodoro state"
ON public.pomodoro_state
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own state
CREATE POLICY "Users can update their own pomodoro state"
ON public.pomodoro_state
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating last_updated_at
CREATE TRIGGER update_pomodoro_state_updated_at
BEFORE UPDATE ON public.pomodoro_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_pomodoro_state_user_id ON public.pomodoro_state(user_id);