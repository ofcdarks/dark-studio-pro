-- Tabela para configurações de monitoramento viral por usuário
CREATE TABLE public.viral_monitoring_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  niches TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  check_interval_hours INTEGER NOT NULL DEFAULT 1,
  viral_threshold INTEGER NOT NULL DEFAULT 1000,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT max_5_niches CHECK (array_length(niches, 1) <= 5 OR niches = '{}')
);

-- Apenas uma config por usuário
CREATE UNIQUE INDEX viral_monitoring_config_user_unique ON public.viral_monitoring_config(user_id);

-- Enable RLS
ALTER TABLE public.viral_monitoring_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own config"
ON public.viral_monitoring_config
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
ON public.viral_monitoring_config
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
ON public.viral_monitoring_config
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_viral_monitoring_config_updated_at
BEFORE UPDATE ON public.viral_monitoring_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Permitir leitura via service role para o n8n (política pública para busca)
CREATE POLICY "Service role can read all configs"
ON public.viral_monitoring_config
FOR SELECT
USING (true);