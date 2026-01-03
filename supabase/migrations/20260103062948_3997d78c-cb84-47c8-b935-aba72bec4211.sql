-- Create table for agent files
CREATE TABLE public.agent_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.script_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_files ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own agent files"
ON public.agent_files FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent files"
ON public.agent_files FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent files"
ON public.agent_files FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for agent files
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-files', 'agent-files', false);

-- Storage RLS policies
CREATE POLICY "Users can view their own agent files"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own agent files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agent-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own agent files"
ON storage.objects FOR DELETE
USING (bucket_id = 'agent-files' AND auth.uid()::text = (storage.foldername(name))[1]);