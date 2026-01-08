-- Enable Realtime for the reports and cleanup_actions tables
-- This allows the frontend to listen for new entries and updates instantly

ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cleanup_actions;
