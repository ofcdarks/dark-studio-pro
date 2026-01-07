-- Create table to track ImageFX usage per user per month
CREATE TABLE public.imagefx_monthly_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  images_generated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.imagefx_monthly_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own ImageFX usage"
ON public.imagefx_monthly_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert their own ImageFX usage"
ON public.imagefx_monthly_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update their own ImageFX usage"
ON public.imagefx_monthly_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to increment ImageFX usage
CREATE OR REPLACE FUNCTION public.increment_imagefx_usage(p_user_id UUID, p_count INTEGER DEFAULT 1)
RETURNS TABLE(new_count INTEGER, month_limit INTEGER, is_limit_reached BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_plan_name TEXT;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get user's plan and limit
  SELECT pp.plan_name, pp.imagefx_monthly_limit
  INTO v_plan_name, v_limit
  FROM plan_permissions pp
  JOIN user_roles ur ON ur.role::text = 
    CASE 
      WHEN pp.plan_name = 'FREE' THEN 'free'
      WHEN pp.plan_name IN ('START CREATOR', 'TURBO MAKER', 'MASTER PRO') THEN 'pro'
      ELSE 'free'
    END
  WHERE ur.user_id = p_user_id
  AND pp.is_annual = false
  LIMIT 1;
  
  -- If no plan found, check if admin
  IF v_limit IS NULL THEN
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin') THEN
      v_limit := NULL; -- Unlimited for admin
    ELSE
      -- Default to FREE plan limit
      SELECT imagefx_monthly_limit INTO v_limit 
      FROM plan_permissions 
      WHERE plan_name = 'FREE' AND is_annual = false
      LIMIT 1;
    END IF;
  END IF;
  
  -- Upsert usage record
  INSERT INTO imagefx_monthly_usage (user_id, month_year, images_generated)
  VALUES (p_user_id, v_month_year, p_count)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET 
    images_generated = imagefx_monthly_usage.images_generated + p_count,
    updated_at = now()
  RETURNING images_generated INTO v_current_count;
  
  RETURN QUERY SELECT 
    v_current_count,
    v_limit,
    CASE WHEN v_limit IS NOT NULL AND v_current_count > v_limit THEN true ELSE false END;
END;
$$;

-- Create function to get current ImageFX usage
CREATE OR REPLACE FUNCTION public.get_imagefx_usage(p_user_id UUID)
RETURNS TABLE(current_count INTEGER, month_limit INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get current usage
  SELECT COALESCE(images_generated, 0)
  INTO v_current_count
  FROM imagefx_monthly_usage
  WHERE user_id = p_user_id AND month_year = v_month_year;
  
  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;
  
  -- Get user's plan limit
  SELECT pp.imagefx_monthly_limit
  INTO v_limit
  FROM plan_permissions pp
  JOIN user_roles ur ON ur.role::text = 
    CASE 
      WHEN pp.plan_name = 'FREE' THEN 'free'
      WHEN pp.plan_name IN ('START CREATOR', 'TURBO MAKER', 'MASTER PRO') THEN 'pro'
      ELSE 'free'
    END
  WHERE ur.user_id = p_user_id
  AND pp.is_annual = false
  LIMIT 1;
  
  -- If no plan found, check if admin
  IF v_limit IS NULL THEN
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin') THEN
      v_limit := NULL; -- Unlimited for admin
    ELSE
      -- Default to FREE plan limit
      SELECT imagefx_monthly_limit INTO v_limit 
      FROM plan_permissions 
      WHERE plan_name = 'FREE' AND is_annual = false
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN QUERY SELECT 
    v_current_count,
    v_limit,
    CASE WHEN v_limit IS NOT NULL THEN GREATEST(0, v_limit - v_current_count) ELSE NULL END;
END;
$$;