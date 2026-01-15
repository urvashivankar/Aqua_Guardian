-- Create a comprehensive leaderboard view
-- Aggregates total NFTs earned from both pollution reports and cleanup actions

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
