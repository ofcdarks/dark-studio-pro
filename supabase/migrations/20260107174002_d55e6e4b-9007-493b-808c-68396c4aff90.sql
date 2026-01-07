-- Create blog_articles table for auto-generated articles
CREATE TABLE public.blog_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'YouTube',
  read_time TEXT DEFAULT '5 min',
  image_url TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage blog articles"
ON public.blog_articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Everyone can read published articles
CREATE POLICY "Anyone can read published articles"
ON public.blog_articles
FOR SELECT
USING (is_published = true);

-- Create index for faster lookups
CREATE INDEX idx_blog_articles_slug ON public.blog_articles(slug);
CREATE INDEX idx_blog_articles_category ON public.blog_articles(category);
CREATE INDEX idx_blog_articles_published ON public.blog_articles(is_published);

-- Create trigger for updated_at
CREATE TRIGGER update_blog_articles_updated_at
BEFORE UPDATE ON public.blog_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();