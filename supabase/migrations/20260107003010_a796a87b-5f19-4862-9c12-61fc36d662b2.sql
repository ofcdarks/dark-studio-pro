-- Enable realtime for profiles table to track new user registrations
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;