import sys
import os
import pathlib

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def final_meta_fix():
    email = "vdr.manager@gmail.com"
    name = "Vadodara Admin"
    
    try:
        auth_users = supabase.auth.admin.list_users()
        user = next((u for u in auth_users if u.email == email), None)
        
        if user:
            print(f"Applying final metadata fix for {email}")
            supabase.auth.admin.update_user_by_id(
                user.id,
                {
                    "user_metadata": {
                        "name": name,
                        "full_name": name,
                        "role": "government",
                        "city": "Vadodara"
                    }
                }
            )
            print("Successfully updated.")
        else:
            print(f"User {email} not found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    final_meta_fix()
