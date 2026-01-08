-- Add reminder configuration columns to publication_schedule
ALTER TABLE public.publication_schedule 
ADD COLUMN IF NOT EXISTS reminder_hours integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT true;

-- Create table to store user push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create table to log sent reminders (avoid duplicates)
CREATE TABLE IF NOT EXISTS public.schedule_reminders_sent (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id uuid NOT NULL REFERENCES public.publication_schedule(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  reminder_type text DEFAULT 'push',
  UNIQUE(schedule_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.schedule_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON public.schedule_reminders_sent
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert reminders"
  ON public.schedule_reminders_sent
  FOR INSERT
  WITH CHECK (true);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_publication_schedule_reminder 
  ON public.publication_schedule(scheduled_date, scheduled_time, reminder_enabled, reminder_sent);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
  ON public.push_subscriptions(user_id);