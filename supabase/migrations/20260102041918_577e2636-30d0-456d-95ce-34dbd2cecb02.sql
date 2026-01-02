-- Create table for viral thumbnails (generated thumbnails saved to library)
CREATE TABLE public.viral_thumbnails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  video_title TEXT NOT NULL,
  headline TEXT,
  seo_description TEXT,
  seo_tags TEXT,
  prompt TEXT,
  style TEXT,
  niche TEXT,
  sub_niche TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.viral_thumbnails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own viral thumbnails"
ON public.viral_thumbnails
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own viral thumbnails"
ON public.viral_thumbnails
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own viral thumbnails"
ON public.viral_thumbnails
FOR DELETE
USING (auth.uid() = user_id);