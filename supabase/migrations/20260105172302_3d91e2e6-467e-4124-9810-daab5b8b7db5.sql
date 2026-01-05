-- Add notification preferences columns to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS notify_viral_videos boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_weekly_reports boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_features boolean DEFAULT true;