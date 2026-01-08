-- Add schedule_id to link tasks to scheduled videos
ALTER TABLE public.production_board_tasks
ADD COLUMN schedule_id UUID REFERENCES public.publication_schedule(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_production_board_tasks_schedule_id ON public.production_board_tasks(schedule_id);

-- Add RLS policy for the new column (existing policies already cover user_id)