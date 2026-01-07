-- Create table for blog page views
CREATE TABLE public.blog_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create index for efficient querying
CREATE INDEX idx_blog_page_views_article_id ON public.blog_page_views(article_id);
CREATE INDEX idx_blog_page_views_viewed_at ON public.blog_page_views(viewed_at);
CREATE INDEX idx_blog_page_views_page_path ON public.blog_page_views(page_path);
CREATE INDEX idx_blog_page_views_view_date ON public.blog_page_views(view_date);
CREATE UNIQUE INDEX idx_blog_page_views_unique ON public.blog_page_views(article_id, visitor_hash, view_date);

-- Enable RLS
ALTER TABLE public.blog_page_views ENABLE ROW LEVEL SECURITY;

-- Allow inserts from edge functions (service role)
CREATE POLICY "Service role can insert views" ON public.blog_page_views
  FOR INSERT WITH CHECK (true);

-- Allow admins to read all views
CREATE POLICY "Admins can read views" ON public.blog_page_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Add view_count and seo_score columns to blog_articles
ALTER TABLE public.blog_articles 
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;