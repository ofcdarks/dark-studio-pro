-- Allow admins to manage credits and view users

-- PROFILES: admins can view all user profiles (needed for admin search/list)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- USER_CREDITS: admins can read/write any user's balance
CREATE POLICY "Admins can view all credits"
ON public.user_credits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert credits"
ON public.user_credits
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update credits"
ON public.user_credits
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- CREDIT_TRANSACTIONS: admins can view/insert transactions for any user
CREATE POLICY "Admins can view all credit transactions"
ON public.credit_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert credit transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- CREDIT_USAGE: admins can view usage for any user (reports)
CREATE POLICY "Admins can view all credit usage"
ON public.credit_usage
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
