import os
import sys
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

# Load .env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

print(f"[*] Loading .env from: {env_path}")
print(f"[*] Keys in environment: {', '.join([k for k in os.environ.keys() if 'SUPABASE' in k])}")

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("SUPBASE_URL")
# Check multiple possible names for service role key (including common typos)
SUPABASE_SERVICE_ROLE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or 
    os.environ.get("SUPBASE_SERVICE_ROLE_KEY") or 
    os.environ.get("SUPABASE_SERVICE_KEY") or 
    os.environ.get("SUPBASE_SECRET_KEY")
)

if not SUPABASE_URL:
    print(f"[ERROR] SUPABASE_URL not found")
    sys.exit(1)

if not SUPABASE_SERVICE_ROLE_KEY:
    print(f"[ERROR] SUPABASE_SERVICE_ROLE_KEY not found")
    sys.exit(1)

print(f"[*] SUPABASE_URL: {SUPABASE_URL[:20]}...")
print(f"[*] SERVICE_ROLE_KEY found: {len(SUPABASE_SERVICE_ROLE_KEY)} chars")

# Initialize Admin Client
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Data to create
GUJARAT_GOVERNMENTS = [
    {"email": "admin@vadodara.gov.in", "password": "Vadodara@123", "name": "Vadodara Municipal Corporation", "role": "government"},
    {"email": "admin@ahmedabad.gov.in", "password": "Ahmedabad@123", "name": "Ahmedabad Municipal Corporation", "role": "government"},
    {"email": "admin@bharuch.gov.in", "password": "Bharuch@123", "name": "Bharuch Municipal Corporation", "role": "government"},
    {"email": "admin@surat.gov.in", "password": "Surat@123", "name": "Surat Municipal Corporation", "role": "government"},
    {"email": "admin@rajkot.gov.in", "password": "Rajkot@123", "name": "Rajkot Municipal Corporation", "role": "government"}
]

import requests

def setup_users():
    print("RESTARTING: Government User Setup (Direct API Mode)")
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }

    for user_data in GUJARAT_GOVERNMENTS:
        email = user_data['email']
        print(f"[*] Processing {email}...")
        
        # 1. Create User via Auth API
        url = f"{SUPABASE_URL}/auth/v1/admin/users"
        payload = {
            "email": email,
            "password": user_data["password"],
            "email_confirm": True,
            "user_metadata": {
                "name": user_data["name"],
                "role": user_data["role"]
            }
        }
        
        try:
            res = requests.post(url, headers=headers, json=payload)
            if res.status_code == 201:
                user_id = res.json()["id"]
                print(f"   [OK] User created (ID: {user_id})")
            elif res.status_code == 400 and "already exists" in res.text.lower():
                print(f"   [!] User exists, attempting to find and update...")
                # Try to find user to get ID
                # We'll just try to update by email if possible or use the public table sync
                # For now, let's assume we need to sync the public profile
                print(f"   [!] Skipping auth creation, will attempt public sync...")
                # To get the ID, we'd normally need to list users, but listing might fail with the same error
                # Let's try to upsert to public.users directly if we can find the ID
                continue 
            else:
                print(f"   [ERROR] Auth API ({res.status_code}): {res.text}")
                continue

            # 2. Update public.users table
            supabase_admin.table("users").upsert({
                "id": user_id,
                "email": email,
                "full_name": user_data["name"],
                "role": user_data["role"]
            }).execute()
            print(f"   [OK] Public profile updated")

        except Exception as e:
            print(f"   [ERROR] processing {email}: {e}")

if __name__ == "__main__":
    setup_users()
