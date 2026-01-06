-- Create table for batch generation history
CREATE TABLE public.batch_generation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  prompts TEXT NOT NULL,
  style_id TEXT,
  style_name TEXT,
  prompt_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.batch_generation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own batch history" 
ON public.batch_generation_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch history" 
ON public.batch_generation_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batch history" 
ON public.batch_generation_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_batch_generation_history_user_id ON public.batch_generation_history(user_id);
CREATE INDEX idx_batch_generation_history_created_at ON public.batch_generation_history(created_at DESC);