-- Allow public read access to landing page video setting
CREATE POLICY "Anyone can view landing video setting"
ON public.admin_settings
FOR SELECT
USING (key = 'landing_video_url');