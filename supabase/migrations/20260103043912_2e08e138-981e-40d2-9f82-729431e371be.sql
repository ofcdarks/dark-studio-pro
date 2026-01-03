-- Create saved analytics channels table
CREATE TABLE public.saved_analytics_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_url TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_thumbnail TEXT,
  subscribers INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  last_fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cached_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_url)
);

-- Enable RLS
ALTER TABLE public.saved_analytics_channels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved channels"
ON public.saved_analytics_channels
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved channels"
ON public.saved_analytics_channels
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved channels"
ON public.saved_analytics_channels
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved channels"
ON public.saved_analytics_channels
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_analytics_channels_updated_at
BEFORE UPDATE ON public.saved_analytics_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();