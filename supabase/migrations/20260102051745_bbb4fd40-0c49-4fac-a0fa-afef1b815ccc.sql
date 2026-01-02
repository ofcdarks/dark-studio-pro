-- Add RLS policies for admins to manage api_providers
CREATE POLICY "Admins can insert providers" 
ON public.api_providers 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update providers" 
ON public.api_providers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete providers" 
ON public.api_providers 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));