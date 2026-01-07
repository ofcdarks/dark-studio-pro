-- Allow clients to read plan definitions (used for pricing & feature gating)
DROP POLICY IF EXISTS "Plan permissions are readable" ON public.plan_permissions;
CREATE POLICY "Plan permissions are readable"
ON public.plan_permissions
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow users to read their own role (and admins to read all roles)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);
