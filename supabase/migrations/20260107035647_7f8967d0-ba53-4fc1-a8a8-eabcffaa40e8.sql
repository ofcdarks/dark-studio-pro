-- Create table for pending migration invitations
CREATE TABLE public.migration_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  plan_name TEXT NOT NULL DEFAULT 'FREE',
  credits_amount INTEGER NOT NULL DEFAULT 50,
  whatsapp TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'expired')),
  invited_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days')
);

-- Create index for faster lookups
CREATE INDEX idx_migration_invites_email ON public.migration_invites(email);
CREATE INDEX idx_migration_invites_token ON public.migration_invites(token);
CREATE INDEX idx_migration_invites_status ON public.migration_invites(status);

-- Enable RLS
ALTER TABLE public.migration_invites ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invites
CREATE POLICY "Admins can manage migration invites" 
ON public.migration_invites 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Public can read by token for registration
CREATE POLICY "Anyone can read by token" 
ON public.migration_invites 
FOR SELECT 
USING (true);