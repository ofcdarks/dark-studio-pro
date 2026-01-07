-- Create table for storing YouTube OAuth tokens
CREATE TABLE public.youtube_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  channel_thumbnail TEXT,
  subscribers_count INTEGER,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.youtube_connections ENABLE ROW LEVEL SECURITY;

-- Users can only read their own connection
CREATE POLICY "Users can view their own YouTube connection" 
ON public.youtube_connections 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own connection
CREATE POLICY "Users can create their own YouTube connection" 
ON public.youtube_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own connection
CREATE POLICY "Users can update their own YouTube connection" 
ON public.youtube_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own connection
CREATE POLICY "Users can delete their own YouTube connection" 
ON public.youtube_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_youtube_connections_updated_at
BEFORE UPDATE ON public.youtube_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();