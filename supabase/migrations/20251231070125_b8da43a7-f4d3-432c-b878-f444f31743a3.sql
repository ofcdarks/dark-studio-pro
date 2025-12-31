-- Criar tabela analyzed_videos para armazenar análises de vídeos (conforme doc seção 2.1.5 Passo 6)
CREATE TABLE IF NOT EXISTS public.analyzed_videos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    youtube_video_id TEXT,
    video_url TEXT NOT NULL,
    original_title TEXT,
    translated_title TEXT,
    original_views BIGINT,
    original_comments BIGINT,
    original_days INTEGER,
    original_thumbnail_url TEXT,
    detected_niche TEXT,
    detected_subniche TEXT,
    detected_microniche TEXT,
    analysis_data_json JSONB,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    channel_id UUID,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela generated_titles para armazenar títulos gerados (5 por análise)
CREATE TABLE IF NOT EXISTS public.generated_titles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    video_analysis_id UUID REFERENCES public.analyzed_videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title_text TEXT NOT NULL,
    model_used TEXT,
    pontuacao INTEGER DEFAULT 0,
    explicacao TEXT,
    formula TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.analyzed_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_titles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para analyzed_videos
CREATE POLICY "Users can view their own video analyses" ON public.analyzed_videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own video analyses" ON public.analyzed_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own video analyses" ON public.analyzed_videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own video analyses" ON public.analyzed_videos FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para generated_titles
CREATE POLICY "Users can view their own generated titles" ON public.generated_titles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own generated titles" ON public.generated_titles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own generated titles" ON public.generated_titles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own generated titles" ON public.generated_titles FOR DELETE USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_analyzed_videos_user_id ON public.analyzed_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_analyzed_videos_youtube_id ON public.analyzed_videos(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_generated_titles_analysis_id ON public.generated_titles(video_analysis_id);
CREATE INDEX IF NOT EXISTS idx_generated_titles_user_id ON public.generated_titles(user_id);