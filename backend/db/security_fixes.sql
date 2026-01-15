-- ==========================================
-- 1. Enable RLS on all identified tables
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Add BASIC SAFE POLICIES
-- ==========================================

-- Users can read ONLY their own profile data
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Water quality readings: Public can read, only logged-in can insert
DROP POLICY IF EXISTS "Public can read water data" ON public.water_quality_readings;
CREATE POLICY "Public can read water data"
ON public.water_quality_readings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only logged-in users can insert" ON public.water_quality_readings;
CREATE POLICY "Only logged-in users can insert"
ON public.water_quality_readings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Success stories: Public read
DROP POLICY IF EXISTS "Public read success stories" ON public.success_stories;
CREATE POLICY "Public read success stories"
ON public.success_stories
FOR SELECT
USING (true);

-- User badges: User-only access
DROP POLICY IF EXISTS "Users see own badges" ON public.user_badges;
CREATE POLICY "Users see own badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id);

-- User points: User-only access
DROP POLICY IF EXISTS "Users see own points" ON public.user_points;
CREATE POLICY "Users see own points"
ON public.user_points
FOR SELECT
USING (auth.uid() = user_id);

-- Points transactions: User-only access
DROP POLICY IF EXISTS "Users see own transactions" ON public.points_transactions;
CREATE POLICY "Users see own transactions"
ON public.points_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- ==========================================
-- 3. Lock search_path for Functions
-- ==========================================
-- Prevents SQL injection via schema hijacking

ALTER FUNCTION IF EXISTS public.handle_new_user()
SET search_path = public, auth;

ALTER FUNCTION IF EXISTS public.update_updated_at_column()
SET search_path = public;

ALTER FUNCTION IF EXISTS public.update_participants_count()
SET search_path = public;

-- ==========================================
-- 4. Restrict cleanup_actions Policy
-- ==========================================
-- Change from "Public" to "Admin only"

DROP POLICY IF EXISTS "cleanup_actions_policy" ON public.cleanup_actions;
-- If cleanup_actions table exists, restrict it
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'cleanup_actions') THEN
        ALTER TABLE public.cleanup_actions ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Admin only cleanup"
        ON public.cleanup_actions
        FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
END $$;
