-- Tabela para thumbnails de referência
CREATE TABLE public.reference_thumbnails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  channel_name TEXT,
  niche TEXT,
  sub_niche TEXT,
  description TEXT,
  extracted_prompt TEXT,
  style_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reference_thumbnails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own thumbnails"
ON public.reference_thumbnails FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thumbnails"
ON public.reference_thumbnails FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thumbnails"
ON public.reference_thumbnails FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thumbnails"
ON public.reference_thumbnails FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_reference_thumbnails_updated_at
BEFORE UPDATE ON public.reference_thumbnails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para armazenar as thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-thumbnails', 'reference-thumbnails', true);

-- Policies para o bucket
CREATE POLICY "Users can view reference thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'reference-thumbnails');

CREATE POLICY "Users can upload their own reference thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reference-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own reference thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reference-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own reference thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'reference-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);