-- Adicionar campo video_type e ai_analysis à tabela viral_videos
ALTER TABLE public.viral_videos 
ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'long',
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT;

-- Adicionar campo video_types à tabela de configuração
ALTER TABLE public.viral_monitoring_config
ADD COLUMN IF NOT EXISTS video_types TEXT[] DEFAULT ARRAY['long', 'short'];

-- Comentários para documentação
COMMENT ON COLUMN public.viral_videos.video_type IS 'Tipo do vídeo: long ou short';
COMMENT ON COLUMN public.viral_videos.ai_analysis IS 'Análise de IA explicando por que o vídeo está viralizando';
COMMENT ON COLUMN public.viral_videos.duration IS 'Duração do vídeo';
COMMENT ON COLUMN public.viral_monitoring_config.video_types IS 'Tipos de vídeo para monitorar: long, short ou ambos';