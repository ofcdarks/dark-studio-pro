-- Add period support to channel_goals (monthly vs all-time)
ALTER TABLE public.channel_goals
ADD COLUMN IF NOT EXISTS period_type TEXT NOT NULL DEFAULT 'all_time',
ADD COLUMN IF NOT EXISTS period_key TEXT;

-- Backfill existing rows (created before period support)
UPDATE public.channel_goals
SET period_type = 'all_time'
WHERE period_type IS NULL OR period_type = '';

-- Helpful index for queries
CREATE INDEX IF NOT EXISTS idx_channel_goals_user_channel_period
ON public.channel_goals (user_id, channel_url, period_type, period_key);