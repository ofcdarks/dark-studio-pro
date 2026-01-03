-- Criar tabela para vídeos fixados de canais monitorados
CREATE TABLE public.pinned_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID REFERENCES public.monitored_channels(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  views TEXT,
  likes TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pinned_videos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own pinned videos"
ON public.pinned_videos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pinned videos"
ON public.pinned_videos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pinned videos"
ON public.pinned_videos FOR DELETE
USING (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX idx_pinned_videos_user_channel ON public.pinned_videos(user_id, channel_id);