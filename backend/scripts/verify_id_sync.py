import sys
import os
import pathlib

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def verify_sync():
    email = "vdr.manager@gmail.com"
    try:
        # 1. Check Auth User
        print(f"--- Checking Auth for {email} ---")
        auth_users = supabase.auth.admin.list_users()
        auth_user = next((u for u in auth_users if u.email == email), None)
        if auth_user:
            print(f"Auth ID: {auth_user.id}")
        else:
            print("User not found in Auth!")

        # 2. Check Public User
        print(f"\n--- Checking Public for {email} ---")
        pub_res = supabase.table("users").select("id, email, full_name").eq("email", email).execute()
        if pub_res.data:
            pub_user = pub_res.data[0]
            print(f"Public ID: {pub_user['id']}")
            print(f"Full Name: {pub_user['full_name']}")
        else:
            print("User not found in Public users table!")

        # 3. Check Jurisdictions
        print("\n--- Checking Jurisdictions ---")
        jur_res = supabase.table("government_jurisdictions").select("*").execute()
        for j in jur_res.data:
            print(f"Jur ID: {j['id']} | UserID: {j['government_user_id']} | City: {j['city_name']}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_sync()
