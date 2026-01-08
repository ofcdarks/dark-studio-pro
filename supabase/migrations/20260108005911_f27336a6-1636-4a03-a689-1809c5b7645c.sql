-- Create production board tasks table
CREATE TABLE public.production_board_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'other',
  column_id TEXT NOT NULL DEFAULT 'backlog',
  task_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_board_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tasks"
ON public.production_board_tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON public.production_board_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.production_board_tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.production_board_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_production_board_tasks_user_id ON public.production_board_tasks(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_production_board_tasks_updated_at
BEFORE UPDATE ON public.production_board_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();