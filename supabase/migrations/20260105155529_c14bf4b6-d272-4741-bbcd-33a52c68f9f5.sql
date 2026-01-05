-- Create table for SRT history
CREATE TABLE public.srt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  original_text TEXT NOT NULL,
  srt_content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  block_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.srt_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own SRT history"
ON public.srt_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SRT history"
ON public.srt_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SRT history"
ON public.srt_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_srt_history_user_id ON public.srt_history(user_id);
CREATE INDEX idx_srt_history_created_at ON public.srt_history(created_at DESC);