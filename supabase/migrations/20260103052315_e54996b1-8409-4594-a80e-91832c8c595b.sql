-- Add display_order column to saved_analytics_channels for reordering
ALTER TABLE public.saved_analytics_channels 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing rows to have sequential order based on created_at
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 as new_order
  FROM public.saved_analytics_channels
)
UPDATE public.saved_analytics_channels
SET display_order = ordered.new_order
FROM ordered
WHERE public.saved_analytics_channels.id = ordered.id;