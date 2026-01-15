-- Fix reports table schema to use proper UUID foreign key
-- This migration fixes the foreign key constraint error

-- Step 0A: Drop ALL RLS policies on reports table dynamically
-- This ensures we catch all policies regardless of their names
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'reports'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reports', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 0B: Drop dependent views
DROP VIEW IF EXISTS public.leaderboard;

-- Step 1: Drop existing foreign key constraint if it exists
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_user_id_fkey;

-- Step 2: Alter user_id column to UUID type
-- Note: This assumes the column currently has valid UUIDs stored as text
ALTER TABLE public.reports 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Step 3: Add proper foreign key constraint
ALTER TABLE public.reports
ADD CONSTRAINT reports_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 4: Add government assignment columns
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS government_id uuid,
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone;

-- Step 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_government_id ON public.reports(government_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Step 6: Add updated_at column if it doesn't exist
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Step 7: Recreate leaderboard view
CREATE OR REPLACE VIEW public.leaderboard AS
WITH report_nfts AS (
    SELECT 
        user_id, 
        COUNT(nft_token_id) as report_nft_count
    FROM public.reports
    WHERE nft_token_id IS NOT NULL
    GROUP BY user_id
),
cleanup_nfts AS (
    SELECT 
        actor_id as user_id, 
        COUNT(nft_token_id) as cleanup_nft_count
    FROM public.cleanup_actions
    WHERE nft_token_id IS NOT NULL
    GROUP BY actor_id
)
SELECT 
    u.id as user_id,
    u.full_name as name,
    u.email,
    u.role,
    u.wallet_address,
    COALESCE(rn.report_nft_count, 0) + COALESCE(cn.cleanup_nft_count, 0) as total_nfts,
    COALESCE(rn.report_nft_count, 0) as reports_verified,
    COALESCE(cn.cleanup_nft_count, 0) as cleanups_completed
FROM public.users u
LEFT JOIN report_nfts rn ON u.id = rn.user_id
LEFT JOIN cleanup_nfts cn ON u.id = cn.user_id
ORDER BY total_nfts DESC;

-- Grant access to the view
ALTER VIEW public.leaderboard OWNER TO postgres;
GRANT SELECT ON public.leaderboard TO anon;
GRANT SELECT ON public.leaderboard TO authenticated;
GRANT SELECT ON public.leaderboard TO service_role;

-- Step 8: Recreate RLS policies on reports table
-- Enable RLS if not already enabled
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own reports
CREATE POLICY "Users can insert their own reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Enable read access for all users (public reports)
CREATE POLICY "Enable read access for all users"
ON public.reports
FOR SELECT
USING (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Reports table schema fixed successfully!';
    RAISE NOTICE 'Leaderboard view recreated successfully!';
    RAISE NOTICE 'RLS policies recreated successfully!';
END $$;
