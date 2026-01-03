-- Enable realtime for video_notifications table
ALTER TABLE public.video_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_notifications;