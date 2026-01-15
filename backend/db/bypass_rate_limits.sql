-- EMERGENCY BYPASS: Create Government Users directly in Database
-- Use this if you hit "email rate limit exceeded" or "Invalid login credentials"
-- This inserts users directly into auth.users and public.users

-- 1. Enable extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    vadodara_id UUID := gen_random_uuid();
    ahmedabad_id UUID := gen_random_uuid();
    bharuch_id UUID := gen_random_uuid();
    surat_id UUID := gen_random_uuid();
    rajkot_id UUID := gen_random_uuid();
BEGIN
    -- VADODARA
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@vadodara.gov.in') THEN
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (vadodara_id, 'authenticated', 'authenticated', 'admin@vadodara.gov.in', crypt('Vadodara@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Vadodara Municipal Corporation","role":"government"}', now(), now(), '', '', '', '');
    END IF;
    
    -- AHMEDABAD
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@ahmedabad.gov.in') THEN
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (ahmedabad_id, 'authenticated', 'authenticated', 'admin@ahmedabad.gov.in', crypt('Ahmedabad@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ahmedabad Municipal Corporation","role":"government"}', now(), now(), '', '', '', '');
    END IF;

    -- BHARUCH
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@bharuch.gov.in') THEN
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (bharuch_id, 'authenticated', 'authenticated', 'admin@bharuch.gov.in', crypt('Bharuch@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Bharuch Municipal Corporation","role":"government"}', now(), now(), '', '', '', '');
    END IF;

    -- SURAT
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@surat.gov.in') THEN
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (surat_id, 'authenticated', 'authenticated', 'admin@surat.gov.in', crypt('Surat@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Surat Municipal Corporation","role":"government"}', now(), now(), '', '', '', '');
    END IF;

    -- RAJKOT
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@rajkot.gov.in') THEN
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (rajkot_id, 'authenticated', 'authenticated', 'admin@rajkot.gov.in', crypt('Rajkot@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Rajkot Municipal Corporation","role":"government"}', now(), now(), '', '', '', '');
    END IF;

    -- Sync to public.users table
    INSERT INTO public.users (id, email, full_name, role)
    SELECT id, email, (raw_user_meta_data->>'name'), (raw_user_meta_data->>'role')
    FROM auth.users 
    WHERE email IN ('admin@vadodara.gov.in', 'admin@ahmedabad.gov.in', 'admin@bharuch.gov.in', 'admin@surat.gov.in', 'admin@rajkot.gov.in')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

    -- Create Jurisdictions
    -- VADODARA
    IF NOT EXISTS (SELECT 1 FROM public.government_jurisdictions WHERE government_code = 'GOV_VDR_001') THEN
        INSERT INTO public.government_jurisdictions (government_user_id, government_code, city_name, state, boundary_type, boundary_data)
        SELECT id, 'GOV_VDR_001', 'Vadodara', 'Gujarat', 'city', '{"type": "city", "cities": ["Vadodara", "Baroda"], "coordinates": {"lat": 22.3072, "lng": 73.1812, "radius_km": 50}}'::jsonb
        FROM auth.users WHERE email = 'admin@vadodara.gov.in';
    END IF;

    -- AHMEDABAD
    IF NOT EXISTS (SELECT 1 FROM public.government_jurisdictions WHERE government_code = 'GOV_AMD_001') THEN
        INSERT INTO public.government_jurisdictions (government_user_id, government_code, city_name, state, boundary_type, boundary_data)
        SELECT id, 'GOV_AMD_001', 'Ahmedabad', 'Gujarat', 'city', '{"type": "city", "cities": ["Ahmedabad", "Amdavad"], "coordinates": {"lat": 23.0225, "lng": 72.5714, "radius_km": 50}}'::jsonb
        FROM auth.users WHERE email = 'admin@ahmedabad.gov.in';
    END IF;

    -- BHARUCH
    IF NOT EXISTS (SELECT 1 FROM public.government_jurisdictions WHERE government_code = 'GOV_BHR_001') THEN
        INSERT INTO public.government_jurisdictions (government_user_id, government_code, city_name, state, boundary_type, boundary_data)
        SELECT id, 'GOV_BHR_001', 'Bharuch', 'Gujarat', 'city', '{"type": "city", "cities": ["Bharuch", "Broach"], "coordinates": {"lat": 21.7051, "lng": 72.9959, "radius_km": 40}}'::jsonb
        FROM auth.users WHERE email = 'admin@bharuch.gov.in';
    END IF;

    -- SURAT
    IF NOT EXISTS (SELECT 1 FROM public.government_jurisdictions WHERE government_code = 'GOV_SRT_001') THEN
        INSERT INTO public.government_jurisdictions (government_user_id, government_code, city_name, state, boundary_type, boundary_data)
        SELECT id, 'GOV_SRT_001', 'Surat', 'Gujarat', 'city', '{"type": "city", "cities": ["Surat"], "coordinates": {"lat": 21.1702, "lng": 72.8311, "radius_km": 45}}'::jsonb
        FROM auth.users WHERE email = 'admin@surat.gov.in';
    END IF;

    -- RAJKOT
    IF NOT EXISTS (SELECT 1 FROM public.government_jurisdictions WHERE government_code = 'GOV_RJK_001') THEN
        INSERT INTO public.government_jurisdictions (government_user_id, government_code, city_name, state, boundary_type, boundary_data)
        SELECT id, 'GOV_RJK_001', 'Rajkot', 'Gujarat', 'city', '{"type": "city", "cities": ["Rajkot"], "coordinates": {"lat": 22.3039, "lng": 70.8022, "radius_km": 40}}'::jsonb
        FROM auth.users WHERE email = 'admin@rajkot.gov.in';
    END IF;

END $$;

