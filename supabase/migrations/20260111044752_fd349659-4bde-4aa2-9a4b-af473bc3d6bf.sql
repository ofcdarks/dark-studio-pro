-- Add scheduled_time and daily_clicks tracking to viral_monitoring_config
ALTER TABLE public.viral_monitoring_config
ADD COLUMN IF NOT EXISTS scheduled_time TEXT DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS daily_clicks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_clicks_date DATE DEFAULT CURRENT_DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.viral_monitoring_config.scheduled_time IS 'Hora do dia para verificação automática (formato HH:MM)';
COMMENT ON COLUMN public.viral_monitoring_config.daily_clicks_count IS 'Contador de cliques manuais no dia';
COMMENT ON COLUMN public.viral_monitoring_config.daily_clicks_date IS 'Data do último reset do contador de cliques';