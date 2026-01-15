-- ==========================================
-- EMERGENCY DEMO FIX: Relax RLS for Visibility
-- ==========================================

-- Allow all users to see public profiles (fixes "vdr.manager" name fallback)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.users
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow all reports to be readable by authenticated users (fixes empty dashboard)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reports are readable by all authenticated" ON public.reports;
CREATE POLICY "Reports are readable by all authenticated"
ON public.reports
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Ensure jurisdictions are readable
ALTER TABLE public.government_jurisdictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Jurisdictions are readable" ON public.government_jurisdictions;
CREATE POLICY "Jurisdictions are readable"
ON public.government_jurisdictions
FOR SELECT
USING (auth.uid() IS NOT NULL);
