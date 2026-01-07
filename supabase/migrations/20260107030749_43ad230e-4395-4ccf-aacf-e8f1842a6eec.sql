-- Add directive update frequency preference to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS directive_update_hours integer DEFAULT 24;