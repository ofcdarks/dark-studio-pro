-- Fix get_imagefx_usage to correctly handle paid plans (unlimited ImageFX)
CREATE OR REPLACE FUNCTION public.get_imagefx_usage(p_user_id uuid)
RETURNS TABLE(current_count integer, month_limit integer, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_user_role TEXT;
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
  
  -- Get user's role
  SELECT role::text INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Determine limit based on role
  IF v_user_role = 'admin' THEN
    -- Admin: unlimited
    v_limit := NULL;
  ELSIF v_user_role = 'pro' THEN
    -- Pro users: unlimited (all paid plans have NULL limit)
    v_limit := NULL;
  ELSE
    -- Free users: get limit from FREE plan
    SELECT imagefx_monthly_limit INTO v_limit 
    FROM plan_permissions 
    WHERE plan_name = 'FREE' AND is_annual = false
    LIMIT 1;
  END IF;
  
  RETURN QUERY SELECT 
    v_current_count,
    v_limit,
    CASE WHEN v_limit IS NOT NULL THEN GREATEST(0, v_limit - v_current_count) ELSE NULL END;
END;
$$;