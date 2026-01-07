-- Add imagefx_monthly_limit column to plan_permissions
ALTER TABLE public.plan_permissions 
ADD COLUMN IF NOT EXISTS imagefx_monthly_limit integer DEFAULT NULL;

-- Set limits: FREE = 50, others = unlimited (null)
UPDATE plan_permissions SET imagefx_monthly_limit = 50 WHERE plan_name = 'FREE';
UPDATE plan_permissions SET imagefx_monthly_limit = NULL WHERE plan_name != 'FREE';