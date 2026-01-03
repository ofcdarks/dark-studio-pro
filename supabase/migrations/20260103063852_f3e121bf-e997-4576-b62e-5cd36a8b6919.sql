-- Add preferred model column to script_agents
ALTER TABLE public.script_agents
ADD COLUMN preferred_model TEXT DEFAULT 'gpt-4o';