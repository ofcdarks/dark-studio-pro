-- Create channel goals table for tracking growth targets
CREATE TABLE public.channel_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_url TEXT NOT NULL,
  goal_type TEXT NOT NULL, -- 'subscribers', 'views', 'videos', 'engagement'
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  start_value INTEGER DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.channel_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own goals"
ON public.channel_goals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
ON public.channel_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON public.channel_goals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
ON public.channel_goals
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_channel_goals_updated_at
BEFORE UPDATE ON public.channel_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();