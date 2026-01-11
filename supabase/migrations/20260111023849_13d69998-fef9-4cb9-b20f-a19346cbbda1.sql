-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert viral videos" ON public.viral_videos;

-- The service role bypass RLS by default, so no need for a special policy
-- The existing policies are sufficient for user operations