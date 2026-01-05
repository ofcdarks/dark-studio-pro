-- Add notes column to saved_analytics_channels for storing personalized checklist notes
ALTER TABLE public.saved_analytics_channels 
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Add notes_updated_at to track when notes were last modified
ALTER TABLE public.saved_analytics_channels 
ADD COLUMN IF NOT EXISTS notes_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;