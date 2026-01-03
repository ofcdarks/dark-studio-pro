-- Add notification preference column to monitored_channels
ALTER TABLE public.monitored_channels 
ADD COLUMN IF NOT EXISTS notify_new_videos boolean DEFAULT false;

-- Add last_video_id to track the latest video
ALTER TABLE public.monitored_channels 
ADD COLUMN IF NOT EXISTS last_video_id text;