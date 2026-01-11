-- Create table to track viral detection usage per user per day
CREATE TABLE public.viral_detection_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.viral_detection_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own usage"
  ON public.viral_detection_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON public.viral_detection_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.viral_detection_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_viral_detection_usage_updated_at
  BEFORE UPDATE ON public.viral_detection_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment usage and check limit
CREATE OR REPLACE FUNCTION public.increment_viral_detection_usage(p_user_id UUID)
RETURNS TABLE(current_count INTEGER, daily_limit INTEGER, can_use BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_user_role TEXT;
BEGIN
  -- Get user's role
  SELECT role::text INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Determine limit based on role
  -- admin/master = unlimited (NULL)
  -- pro = check plan_permissions or default to 10
  -- free = 1
  IF v_user_role = 'admin' THEN
    v_limit := NULL; -- Unlimited
  ELSIF v_user_role = 'pro' THEN
    -- Check plan_permissions for specific limit, default to 10
    v_limit := 10;
  ELSE
    v_limit := 1; -- Free users
  END IF;
  
  -- Upsert usage record for today
  INSERT INTO viral_detection_usage (user_id, usage_date, usage_count, last_used_at)
  VALUES (p_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET 
    usage_count = viral_detection_usage.usage_count + 1,
    last_used_at = now(),
    updated_at = now()
  RETURNING usage_count INTO v_current_count;
  
  RETURN QUERY SELECT 
    v_current_count,
    v_limit,
    CASE 
      WHEN v_limit IS NULL THEN true  -- Unlimited
      WHEN v_current_count <= v_limit THEN true
      ELSE false
    END;
END;
$$;

-- Function to get current usage without incrementing
CREATE OR REPLACE FUNCTION public.get_viral_detection_usage(p_user_id UUID)
RETURNS TABLE(current_count INTEGER, daily_limit INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_user_role TEXT;
BEGIN
  -- Get user's role
  SELECT role::text INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Determine limit based on role
  IF v_user_role = 'admin' THEN
    v_limit := NULL; -- Unlimited
  ELSIF v_user_role = 'pro' THEN
    v_limit := 10; -- Pro default
  ELSE
    v_limit := 1; -- Free
  END IF;
  
  -- Get current usage for today
  SELECT COALESCE(usage_count, 0)
  INTO v_current_count
  FROM viral_detection_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  
  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_current_count,
    v_limit,
    CASE WHEN v_limit IS NOT NULL THEN GREATEST(0, v_limit - v_current_count) ELSE NULL END;
END;
$$;