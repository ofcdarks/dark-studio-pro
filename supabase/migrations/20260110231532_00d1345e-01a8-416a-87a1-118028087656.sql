-- Tabela para rastrear gerações de vídeo via n8n
CREATE TABLE public.video_generation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'veo31',
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  status TEXT NOT NULL DEFAULT 'pending',
  video_url TEXT,
  error_message TEXT,
  n8n_task_id TEXT,
  webhook_response JSONB,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_video_jobs_user_id ON public.video_generation_jobs(user_id);
CREATE INDEX idx_video_jobs_status ON public.video_generation_jobs(status);
CREATE INDEX idx_video_jobs_n8n_task ON public.video_generation_jobs(n8n_task_id);

-- Enable RLS
ALTER TABLE public.video_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own video jobs" 
ON public.video_generation_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video jobs" 
ON public.video_generation_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video jobs" 
ON public.video_generation_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_video_jobs_updated_at
BEFORE UPDATE ON public.video_generation_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();