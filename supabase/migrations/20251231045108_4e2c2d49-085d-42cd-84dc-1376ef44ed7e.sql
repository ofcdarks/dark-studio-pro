-- Create table for user API settings
CREATE TABLE public.user_api_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  openai_api_key TEXT,
  claude_api_key TEXT,
  gemini_api_key TEXT,
  elevenlabs_api_key TEXT,
  youtube_api_key TEXT,
  openai_validated BOOLEAN DEFAULT FALSE,
  claude_validated BOOLEAN DEFAULT FALSE,
  gemini_validated BOOLEAN DEFAULT FALSE,
  elevenlabs_validated BOOLEAN DEFAULT FALSE,
  youtube_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_api_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own API settings"
ON public.user_api_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API settings"
ON public.user_api_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API settings"
ON public.user_api_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_api_settings_updated_at
BEFORE UPDATE ON public.user_api_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();