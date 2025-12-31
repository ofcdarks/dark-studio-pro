
-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create video_tags junction table
CREATE TABLE public.video_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.analyzed_videos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, tag_id)
);

-- Create title_tags junction table  
CREATE TABLE public.title_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_id UUID NOT NULL REFERENCES public.generated_titles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(title_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_tags ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Users can view their own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Video tags policies (check ownership via video)
CREATE POLICY "Users can view their video tags" ON public.video_tags FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.analyzed_videos WHERE id = video_id AND user_id = auth.uid()));

CREATE POLICY "Users can add tags to their videos" ON public.video_tags FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.analyzed_videos WHERE id = video_id AND user_id = auth.uid()));

CREATE POLICY "Users can remove tags from their videos" ON public.video_tags FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.analyzed_videos WHERE id = video_id AND user_id = auth.uid()));

-- Title tags policies (check ownership via title)
CREATE POLICY "Users can view their title tags" ON public.title_tags FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.generated_titles WHERE id = title_id AND user_id = auth.uid()));

CREATE POLICY "Users can add tags to their titles" ON public.title_tags FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.generated_titles WHERE id = title_id AND user_id = auth.uid()));

CREATE POLICY "Users can remove tags from their titles" ON public.title_tags FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.generated_titles WHERE id = title_id AND user_id = auth.uid()));
