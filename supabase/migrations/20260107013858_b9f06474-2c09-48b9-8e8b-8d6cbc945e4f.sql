-- Insert tool maintenance settings if not exists
INSERT INTO public.admin_settings (key, value)
VALUES ('tool_maintenance', '{
  "tools": {}
}'::jsonb)
ON CONFLICT (key) DO NOTHING;