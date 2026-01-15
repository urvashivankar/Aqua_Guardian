import sys
import os
import pathlib
import time

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def force_fix_final():
    print("--- Aqua Guardian Final Force Fix ---")
    
    accounts = [
        {"email": "alex@citizen.com", "password": "Citizen@123", "name": "Alex Citizen", "role": "citizen"},
        {"email": "green@ngo.org", "password": "Ngo@123", "name": "Green NGO", "role": "ngo"},
        {"email": "vadodara.admin@citizen.com", "password": "Vadodara@123", "name": "Vadodara Municipal Corporation", "role": "government"},
        {"email": "ahmedabad.admin@citizen.com", "password": "Ahmedabad@123", "name": "Ahmedabad Municipal Corporation", "role": "government"},
        {"email": "surat.admin@citizen.com", "password": "Surat@123", "name": "Surat Municipal Corporation", "role": "government"},
        {"email": "rajkot.admin@citizen.com", "password": "Rajkot@123", "name": "Rajkot Municipal Corporation", "role": "government"},
        {"email": "bharuch.admin@citizen.com", "password": "Bharuch@123", "name": "Bharuch Municipal Corporation", "role": "government"},
    ]
    
    auth_users = supabase.auth.admin.list_users()
    auth_map = {u.email: u.id for u in auth_users}

    for acc in accounts:
        email = acc["email"]
        password = acc["password"]
        print(f"\n[*] Processing: {email}")
        
        try:
            # 1. Ensure user exists in Auth
            if email in auth_map:
                user_id = auth_map[email]
                print(f"    - Updating password for existing ID: {user_id}")
                supabase.auth.admin.update_user_by_id(user_id, {
                    "password": password,
                    "email_confirm": True
                })
            else:
                # Completely purge any ghosts first
                print(f"    - User missing from Auth. Purging public data for {email}...")
                supabase.table("users").delete().eq("email", email).execute()
                
                print(f"    - Creating fresh Auth user...")
                res = supabase.auth.admin.create_user({
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"role": acc["role"], "full_name": acc["name"]}
                })
                user_id = res.user.id
                print(f"    - Created New ID: {user_id}")

            # 2. Sync Public Profile (Upsert to be sure)
            print(f"    - Syncing public profile for {user_id}...")
            supabase.table("users").upsert({
                "id": user_id,
                "email": email,
                "role": acc["role"],
                "full_name": acc["name"]
            }).execute()
            
            # 3. VERIFY LOGIN IMMEDIATELY
            time.sleep(1)
            try:
                # Test login using a fresh client to be certain
                test_res = supabase.auth.sign_in_with_password({"email": email, "password": password})
                if test_res.user:
                    print(f"    [VERIFIED] Login works for {email}!")
                else:
                    print(f"    [FAILED] Login check returned no user for {email}.")
            except Exception as login_err:
                print(f"    [FAILED] Login check error: {login_err}")

        except Exception as e:
            print(f"    [ERROR] Global failure for {email}: {e}")

if __name__ == "__main__":
    force_fix_final()
