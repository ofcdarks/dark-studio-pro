-- Add completed_at column to track when tasks are completed
ALTER TABLE public.production_board_tasks 
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Create table for user kanban settings (weekly goal, etc)
CREATE TABLE IF NOT EXISTS public.user_kanban_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  weekly_goal integer NOT NULL DEFAULT 5,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_kanban_settings_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_kanban_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own kanban settings" 
ON public.user_kanban_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own kanban settings" 
ON public.user_kanban_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kanban settings" 
ON public.user_kanban_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_kanban_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_kanban_settings_updated_at
BEFORE UPDATE ON public.user_kanban_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_kanban_settings_updated_at();