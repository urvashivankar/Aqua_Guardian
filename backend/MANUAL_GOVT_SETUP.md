# Quick Guide: Creating Government Users Manually

Since we're hitting Supabase rate limits, here's how to create government users manually via the frontend:

## Option 1: Use Frontend Signup (Recommended)

1. Go to your frontend: http://localhost:5173 (or your deployed URL)
2. Click "Sign Up"
3. Register each government user:

### Vadodara
- Email: `admin@vadodara.gov.in`
- Password: `Vadodara@123`
- Name: `Vadodara Municipal Corporation`
- Role: **Government**

### Ahmedabad
- Email: `admin@ahmedabad.gov.in`
- Password: `Ahmedabad@123`
- Name: `Ahmedabad Municipal Corporation`
- Role: **Government**

### Bharuch
- Email: `admin@bharuch.gov.in`
- Password: `Bharuch@123`
- Name: `Bharuch Municipal Corporation`
- Role: **Government**

### Surat
- Email: `admin@surat.gov.in`
- Password: `Surat@123`
- Name: `Surat Municipal Corporation`
- Role: **Government**

### Rajkot
- Email: `admin@rajkot.gov.in`
- Password: `Rajkot@123`
- Name: `Rajkot Municipal Corporation`
- Role: **Government**

## Option 2: Add Jurisdictions Manually

After creating users via frontend, you'll need to add their jurisdiction mappings in Supabase:

1. Go to Supabase Dashboard → Table Editor → `government_jurisdictions`
2. Insert rows for each government user with their jurisdiction data

**OR** wait 30-60 minutes and run the script again:
```bash
python scripts\add_gujarat_governments.py
```

## Option 3: Test Without Government Users

You can test report submission now - reports will be created but won't be assigned to any government (government_id will be NULL). This is fine for testing the basic functionality.
