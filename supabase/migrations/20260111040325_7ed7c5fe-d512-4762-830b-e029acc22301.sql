-- Add country field to viral_monitoring_config
ALTER TABLE public.viral_monitoring_config
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BR';

-- Add comment
COMMENT ON COLUMN public.viral_monitoring_config.country IS 'Country code for YouTube search (e.g., BR, US, PT)';