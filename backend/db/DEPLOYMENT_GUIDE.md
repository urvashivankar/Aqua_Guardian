# Database Migration & Government Setup Guide

## Overview
This guide walks through fixing the report submission error and setting up government jurisdiction system for Gujarat cities.

## Prerequisites
- Access to Supabase SQL Editor
- Backend environment configured
- Python environment active

## Step 1: Run Database Migrations

### 1.1 Fix Reports Schema
Open Supabase Dashboard → SQL Editor and run:

```bash
# Copy the SQL file content and execute in Supabase SQL Editor
```

Or use the file: [fix_reports_schema.sql](file:///c:/Users/urvashi/OneDrive/Desktop/Aqua_Guardian-github/Aqua_Guardian-master/backend/db/fix_reports_schema.sql)

**What it does:**
- Converts `user_id` from `text` to `uuid`
- Adds proper foreign key constraint
- Adds `government_id` and `assigned_at` columns
- Creates performance indexes

### 1.2 Create Government Jurisdictions Table
Run in Supabase SQL Editor:

```bash
# Copy the SQL file content and execute
```

Or use the file: [government_jurisdictions.sql](file:///c:/Users/urvashi/OneDrive/Desktop/Aqua_Guardian-github/Aqua_Guardian-master/backend/db/government_jurisdictions.sql)

**What it does:**
- Creates `government_jurisdictions` table
- Sets up foreign key to reports
- Enables Row Level Security (RLS)
- Creates access policies

## Step 2: Add Gujarat Government Users

Wait 5-10 minutes after the previous user creation to avoid rate limits, then run:

```bash
cd backend
python scripts\add_gujarat_governments.py
```

**This creates 5 government users:**
- Vadodara: admin@vadodara.gov.in / Vadodara@123
- Ahmedabad: admin@ahmedabad.gov.in / Ahmedabad@123
- Bharuch: admin@bharuch.gov.in / Bharuch@123
- Surat: admin@surat.gov.in / Surat@123
- Rajkot: admin@rajkot.gov.in / Rajkot@123

Each with jurisdiction mapping based on coordinates.

## Step 3: Test the System

### 3.1 Test Report Submission
1. Login as a citizen user
2. Submit a report with location in Gujarat (e.g., Vadodara coordinates: 22.3072, 73.1812)
3. Verify the report is created without errors

### 3.2 Test Government Access
1. Login as a government user (e.g., admin@vadodara.gov.in)
2. Navigate to government dashboard
3. Verify you only see reports from your jurisdiction

## Troubleshooting

### Rate Limit Errors
If you get "email rate limit exceeded":
- Wait 10-15 minutes
- Run the script again
- Or manually register users via frontend

### Foreign Key Errors
If reports still fail:
- Verify migrations ran successfully
- Check that `user_id` is UUID type: `\d reports` in psql
- Ensure user exists in `users` table before submitting report

### No Reports Showing for Government
- Verify jurisdiction was created: Check `government_jurisdictions` table
- Ensure report location falls within jurisdiction radius
- Check logs for jurisdiction assignment messages

## Files Created

- [fix_reports_schema.sql](file:///c:/Users/urvashi/OneDrive/Desktop/Aqua_Guardian-github/Aqua_Guardian-master/backend/db/fix_reports_schema.sql)
- [government_jurisdictions.sql](file:///c:/Users/urvashi/OneDrive/Desktop/Aqua_Guardian-github/Aqua_Guardian-master/backend/db/government_jurisdictions.sql)
- [add_gujarat_governments.py](file:///c:/Users/urvashi/OneDrive/Desktop/Aqua_Guardian-github/Aqua_Guardian-master/backend/scripts/add_gujarat_governments.py)
- [jurisdiction_utils.py](file:///c:/Users/urvashi/OneDrive/Desktop/Aqua_Guardian-github/Aqua_Guardian-master/backend/utils/jurisdiction_utils.py)
- Updated [reports.py](file:///c:/Users/urvashi/OneDrive/Desktop/Aqua_Guardian-github/Aqua_Guardian-master/backend/api/reports.py)
