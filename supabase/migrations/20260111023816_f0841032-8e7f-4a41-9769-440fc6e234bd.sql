-- Create table for viral videos detected by n8n automation
CREATE TABLE public.viral_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  channel_name TEXT,
  channel_url TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viral_score NUMERIC DEFAULT 0, -- views per hour since publish
  niche TEXT,
  keywords TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.viral_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own viral videos"
  ON public.viral_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own viral videos"
  ON public.viral_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own viral videos"
  ON public.viral_videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own viral videos"
  ON public.viral_videos FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service role to insert (for n8n webhook)
CREATE POLICY "Service role can insert viral videos"
  ON public.viral_videos FOR INSERT
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_viral_videos_user_id ON public.viral_videos(user_id);
CREATE INDEX idx_viral_videos_detected_at ON public.viral_videos(detected_at DESC);
CREATE INDEX idx_viral_videos_viral_score ON public.viral_videos(viral_score DESC);

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.viral_videos;