-- Add check frequency preference to user_api_settings
ALTER TABLE public.user_api_settings 
ADD COLUMN IF NOT EXISTS video_check_frequency text DEFAULT '60' CHECK (video_check_frequency IN ('30', '60', '360'));