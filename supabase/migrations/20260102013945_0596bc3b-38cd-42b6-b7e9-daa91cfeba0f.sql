-- Allow public read access to landing page settings
CREATE POLICY "Anyone can view landing settings"
ON public.admin_settings
FOR SELECT
USING (key = 'landing_settings');