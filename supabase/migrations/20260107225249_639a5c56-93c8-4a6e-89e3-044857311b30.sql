-- Create table to track product link clicks
CREATE TABLE public.product_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  product_title TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  visitor_hash TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  click_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable RLS
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (for tracking)
CREATE POLICY "Anyone can insert clicks" 
ON public.product_clicks 
FOR INSERT 
WITH CHECK (true);

-- Only admins can read clicks
CREATE POLICY "Admins can read clicks" 
ON public.product_clicks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'::app_role
));

-- Create index for faster queries
CREATE INDEX idx_product_clicks_article_id ON public.product_clicks(article_id);
CREATE INDEX idx_product_clicks_date ON public.product_clicks(click_date);
CREATE INDEX idx_product_clicks_product_url ON public.product_clicks(product_url);