-- Add new fields to user_api_settings table
ALTER TABLE public.user_api_settings 
ADD COLUMN IF NOT EXISTS use_platform_credits boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS imagefx_cookies text,
ADD COLUMN IF NOT EXISTS imagefx_validated boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.user_api_settings.use_platform_credits IS 'If true, use platform credits. If false, use user own API keys';
COMMENT ON COLUMN public.user_api_settings.imagefx_cookies IS 'ImageFX cookies for image generation';
COMMENT ON COLUMN public.user_api_settings.imagefx_validated IS 'Whether ImageFX cookies are validated';