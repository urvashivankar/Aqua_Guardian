import sys
import os
import pathlib
import time

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path(__file__).parent.parent))

from db.supabase import supabase
from middleware.logging import logger

def definitive_reset():
    print("--- 🏁 Aqua Guardian Definitive Reset 🏁 ---")
    
    users_to_demo = [
        {"email": "alex@citizen.com", "password": "Citizen@123", "name": "Alex Citizen", "role": "citizen"},
        {"email": "green@ngo.org", "password": "Ngo@123", "name": "Green NGO", "role": "ngo"},
        {"email": "admin@vadodara.gov.in", "password": "Vadodara@123", "name": "Vadodara Municipal Corporation", "role": "government"},
        {"email": "admin@ahmedabad.gov.in", "password": "Ahmedabad@123", "name": "Ahmedabad Municipal Corporation", "role": "government"},
        {"email": "admin@surat.gov.in", "password": "Surat@123", "name": "Surat Municipal Corporation", "role": "government"},
        {"email": "admin@rajkot.gov.in", "password": "Rajkot@123", "name": "Rajkot Municipal Corporation", "role": "government"},
        {"email": "admin@bharuch.gov.in", "password": "Bharuch@123", "name": "Bharuch Municipal Corporation", "role": "government"},
    ]

    # Get current auth users to check for existing records
    auth_users = supabase.auth.admin.list_users()
    auth_email_to_id = {u.email: u.id for u in auth_users}

    for user in users_to_demo:
        email = user["email"]
        print(f"\n[🚀] Resetting: {email}")
        
        try:
            # 1. DELETE existing records (surgical cleanup)
            # Delete from public.users (cascade might handle it but let's be sure)
            print(f"   [-] Cleaning public.users...")
            supabase.table("users").delete().eq("email", email).execute()
            
            # Delete from auth.users
            if email in auth_email_to_id:
                print(f"   [-] Cleaning auth.users (ID: {auth_email_to_id[email]})...")
                supabase.auth.admin.delete_user(auth_email_to_id[email])
            
            time.sleep(1) # Wait for Supabase to process deletes

            # 2. CREATE fresh authenticated user
            print(f"   [+] Creating confirmed auth user...")
            response = supabase.auth.admin.create_user({
                "email": email,
                "password": user["password"],
                "email_confirm": True,
                "user_metadata": {"full_name": user["name"], "role": user["role"]}
            })
            
            new_id = response.user.id if hasattr(response, 'user') else response.id
            print(f"   [OK] Auth Created ID: {new_id}")

            # 3. CREATE public profile
            print(f"   [+] Creating public profile...")
            supabase.table("users").insert({
                "id": new_id,
                "email": email,
                "full_name": user["name"],
                "role": user["role"]
            }).execute()
            print(f"   [OK] Public Table Synced.")

        except Exception as e:
            print(f"   [ERROR] Failed to reset {email}: {e}")

if __name__ == "__main__":
    definitive_reset()
    print("\n--- 🌟 Definitive Reset Complete! 🌟 ---")
    print("\n--- ✅ Surgical Reset Finished! ---")
    print("\n--- ✅ Reset Finished! Please try logging in now. ---")
