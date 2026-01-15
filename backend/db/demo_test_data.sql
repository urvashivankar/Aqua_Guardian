-- ========================================
-- AQUA GUARDIAN - REALISTIC DEMO TEST DATA
-- ========================================
-- This script creates realistic pollution reports, cleanups, and interactions
-- for demonstration purposes. Run this AFTER setting up your 3 main users.
--
-- Prerequisites:
-- 1. admin@city.gov (Government)
-- 2. green@ngo.org (NGO)
-- 3. alex@citizen.com (Citizen)
--
-- Usage: Copy and paste into Supabase SQL Editor and run.
-- ========================================

-- Get user IDs (replace with your actual UUIDs if these fail)
DO $$
DECLARE
    citizen_id uuid;
    ngo_id uuid;
    gov_id uuid;
    report1_id uuid;
    report2_id uuid;
    report3_id uuid;
    report4_id uuid;
    cleanup1_id uuid;
BEGIN
    -- Fetch user IDs
    SELECT id INTO citizen_id FROM auth.users WHERE email = 'alex@citizen.com';
    SELECT id INTO ngo_id FROM auth.users WHERE email = 'green@ngo.org';
    SELECT id INTO gov_id FROM auth.users WHERE email = 'admin@city.gov';

    -- Validate users exist
    IF citizen_id IS NULL OR ngo_id IS NULL OR gov_id IS NULL THEN
        RAISE EXCEPTION 'One or more required users not found. Please run seed_users.py first.';
    END IF;

    -- ========================================
    -- 1. CITIZEN REPORTS (4 realistic cases)
    -- ========================================
    
    -- Report 1: High-severity industrial waste (Verified, ready for cleanup)
    INSERT INTO public.reports (
        id, user_id, latitude, longitude, description, severity, 
        ai_class, ai_confidence, status, created_at
    ) VALUES (
        gen_random_uuid(), citizen_id, 19.0760, 72.8777,
        'Industrial chemical waste dumped near Mithi River. Strong odor, dead fish visible. Urgent action needed.',
        9, 'Industrial Waste', 0.94, 'verified', NOW() - INTERVAL '2 days'
    ) RETURNING id INTO report1_id;

    -- Add photo for Report 1
    INSERT INTO public.photos (report_id, url) VALUES (
        report1_id, 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800'
    );

    -- Report 2: Medium-severity plastic pollution (Submitted, pending verification)
    INSERT INTO public.reports (
        id, user_id, latitude, longitude, description, severity,
        ai_class, ai_confidence, status, created_at
    ) VALUES (
        gen_random_uuid(), citizen_id, 19.0176, 72.8561,
        'Massive plastic accumulation at Gateway of India beach. Tourists complaining about the smell.',
        6, 'Plastic Waste', 0.87, 'submitted', NOW() - INTERVAL '1 day'
    ) RETURNING id INTO report2_id;

    INSERT INTO public.photos (report_id, url) VALUES (
        report2_id, 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800'
    );

    -- Report 3: Critical sewage overflow (Verified, high priority)
    INSERT INTO public.reports (
        id, user_id, latitude, longitude, description, severity,
        ai_class, ai_confidence, status, created_at
    ) VALUES (
        gen_random_uuid(), citizen_id, 19.1136, 72.8697,
        'Sewage overflow at Juhu Beach. Health hazard for morning walkers and joggers.',
        8, 'Sewage Contamination', 0.91, 'verified', NOW() - INTERVAL '3 hours'
    ) RETURNING id INTO report3_id;

    INSERT INTO public.photos (report_id, url) VALUES (
        report3_id, 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800'
    );

    -- Report 4: Low-severity litter (Submitted)
    INSERT INTO public.reports (
        id, user_id, latitude, longitude, description, severity,
        ai_class, ai_confidence, status, created_at
    ) VALUES (
        gen_random_uuid(), citizen_id, 19.0330, 72.8479,
        'Scattered plastic bottles and food wrappers near Marine Drive promenade.',
        4, 'Litter', 0.82, 'submitted', NOW() - INTERVAL '5 hours'
    ) RETURNING id INTO report4_id;

    INSERT INTO public.photos (report_id, url) VALUES (
        report4_id, 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800'
    );

    -- ========================================
    -- 2. GOVERNMENT ACTIONS & DISCUSSIONS
    -- ========================================

    -- Government verifies Report 1 and posts status update
    INSERT INTO public.report_discussions (
        report_id, user_id, message_type, content, created_at
    ) VALUES (
        report1_id, gov_id, 'STATUS_UPDATE',
        'Report verified by Municipal Corporation. Deploying hazmat team within 24 hours. Area cordoned off for public safety.',
        NOW() - INTERVAL '1 day'
    );

    -- Government requests more info on Report 3
    INSERT INTO public.report_discussions (
        report_id, user_id, message_type, content, created_at
    ) VALUES (
        report3_id, gov_id, 'INFO_REQUEST',
        'Please confirm if the overflow is continuous or intermittent. We need this info to coordinate with the drainage department.',
        NOW() - INTERVAL '2 hours'
    );

    -- Citizen responds with clarification
    INSERT INTO public.report_discussions (
        report_id, user_id, message_type, content, created_at
    ) VALUES (
        report3_id, citizen_id, 'CLARIFICATION',
        'The overflow happens every morning between 6-8 AM. I have been monitoring for the past 3 days.',
        NOW() - INTERVAL '1 hour'
    );

    -- ========================================
    -- 3. NGO CLEANUP DRIVE
    -- ========================================

    -- NGO creates cleanup for Report 1 (verified industrial waste)
    INSERT INTO public.cleanup_actions (
        id, report_id, actor_id, notes, status, progress
    ) VALUES (
        gen_random_uuid(), report1_id, ngo_id,
        'Green Earth NGO organizing community cleanup drive. Protective gear will be provided. Meeting point: Mithi River Bridge.',
        'in_progress', 0
    ) RETURNING id INTO cleanup1_id;

    -- ========================================
    -- 4. VOLUNTEER PARTICIPATION
    -- ========================================

    -- Citizen joins the cleanup
    INSERT INTO public.cleanup_participation (
        cleanup_id, user_id, role
    ) VALUES (
        cleanup1_id, citizen_id, 'citizen'
    );

    -- Government official also joins (coordination)
    INSERT INTO public.cleanup_participation (
        cleanup_id, user_id, role
    ) VALUES (
        cleanup1_id, gov_id, 'government'
    );

    -- NGO posts field update
    INSERT INTO public.report_discussions (
        report_id, user_id, message_type, content, created_at
    ) VALUES (
        report1_id, ngo_id, 'FIELD_UPDATE',
        '15 volunteers confirmed for tomorrow morning cleanup. Municipal truck arranged for waste disposal.',
        NOW() - INTERVAL '6 hours'
    );

    -- ========================================
    -- 5. LEADERBOARD DATA (Optional - for gamification)
    -- ========================================

    -- Add some NFT adoptions for the citizen (if adoptions table exists)
    -- INSERT INTO public.adoptions (user_id, nft_id, adopted_at) VALUES
    -- (citizen_id, 'whale_001', NOW() - INTERVAL '10 days'),
    -- (citizen_id, 'turtle_002', NOW() - INTERVAL '5 days');

    RAISE NOTICE 'Demo test data created successfully!';
    RAISE NOTICE 'Report IDs: %, %, %, %', report1_id, report2_id, report3_id, report4_id;
    RAISE NOTICE 'Cleanup ID: %', cleanup1_id;
END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify your data was inserted correctly

-- Check reports
SELECT id, description, severity, status, created_at 
FROM public.reports 
ORDER BY created_at DESC 
LIMIT 5;

-- Check discussions
SELECT rd.message_type, rd.content, u.full_name, rd.created_at
FROM public.report_discussions rd
JOIN public.users u ON rd.user_id = u.id
ORDER BY rd.created_at DESC
LIMIT 10;

-- Check cleanups and participation
SELECT ca.notes, COUNT(cp.id) as volunteer_count
FROM public.cleanup_actions ca
LEFT JOIN public.cleanup_participation cp ON ca.id = cp.cleanup_id
GROUP BY ca.id, ca.notes;
