-- Tabela para agenda de publicação
CREATE TABLE public.publication_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'recording', 'editing', 'ready', 'published')),
  niche TEXT,
  video_url TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_publication_schedule_user_date ON public.publication_schedule(user_id, scheduled_date);
CREATE INDEX idx_publication_schedule_status ON public.publication_schedule(status);

-- Enable RLS
ALTER TABLE public.publication_schedule ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own schedule"
  ON public.publication_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own schedule"
  ON public.publication_schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule"
  ON public.publication_schedule FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedule"
  ON public.publication_schedule FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_publication_schedule_updated_at
  BEFORE UPDATE ON public.publication_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para horários sugeridos por nicho
CREATE TABLE public.niche_best_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche TEXT NOT NULL UNIQUE,
  best_days TEXT[] DEFAULT ARRAY['tuesday', 'thursday', 'saturday'],
  best_hours TEXT[] DEFAULT ARRAY['18:00', '20:00'],
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dados iniciais de horários por nicho
INSERT INTO public.niche_best_times (niche, best_days, best_hours, reasoning) VALUES
  ('dark', ARRAY['tuesday', 'thursday', 'saturday'], ARRAY['20:00', '22:00'], 'Público noturno, mais engajado à noite'),
  ('educacional', ARRAY['monday', 'wednesday', 'friday'], ARRAY['08:00', '12:00'], 'Estudantes e profissionais em horário comercial'),
  ('entretenimento', ARRAY['friday', 'saturday', 'sunday'], ARRAY['14:00', '20:00'], 'Fins de semana com mais tempo livre'),
  ('curiosidades', ARRAY['tuesday', 'thursday', 'sunday'], ARRAY['19:00', '21:00'], 'Horário de descanso pós-trabalho'),
  ('tecnologia', ARRAY['tuesday', 'thursday'], ARRAY['10:00', '18:00'], 'Profissionais de tech em horário flexível'),
  ('finanças', ARRAY['monday', 'tuesday', 'wednesday'], ARRAY['07:00', '12:00'], 'Público interessado em início de semana'),
  ('saúde', ARRAY['monday', 'wednesday', 'saturday'], ARRAY['06:00', '19:00'], 'Manhã para motivação, noite para reflexão'),
  ('games', ARRAY['friday', 'saturday', 'sunday'], ARRAY['15:00', '22:00'], 'Gamers mais ativos nos fins de semana');

-- RLS para niche_best_times (leitura pública)
ALTER TABLE public.niche_best_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read niche times"
  ON public.niche_best_times FOR SELECT
  USING (true);