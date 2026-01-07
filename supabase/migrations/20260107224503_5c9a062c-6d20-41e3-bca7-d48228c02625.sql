-- Add product link fields to blog_articles
ALTER TABLE public.blog_articles 
ADD COLUMN IF NOT EXISTS product_url TEXT,
ADD COLUMN IF NOT EXISTS product_title TEXT,
ADD COLUMN IF NOT EXISTS product_cta TEXT DEFAULT 'Saiba Mais';

-- Add comment
COMMENT ON COLUMN public.blog_articles.product_url IS 'URL do produto/afiliado para exibir no artigo';
COMMENT ON COLUMN public.blog_articles.product_title IS 'Título/nome do produto';
COMMENT ON COLUMN public.blog_articles.product_cta IS 'Texto do botão CTA (ex: Comprar Agora, Saiba Mais)';