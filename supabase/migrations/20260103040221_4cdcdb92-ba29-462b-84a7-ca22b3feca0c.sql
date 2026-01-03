-- Create video_notifications table to store detected new videos
CREATE TABLE public.video_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel_id uuid REFERENCES public.monitored_channels(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  video_url text NOT NULL,
  video_title text,
  thumbnail_url text,
  published_at timestamp with time zone,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.video_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.video_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.video_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Service role can insert (for edge function)
CREATE POLICY "Service role can insert notifications"
ON public.video_notifications
FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_video_notifications_user_id ON public.video_notifications(user_id);
CREATE INDEX idx_video_notifications_is_read ON public.video_notifications(is_read);