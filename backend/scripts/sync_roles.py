import sys
import os
import pathlib

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def sync_roles():
    corrections = [
        {"email": "vdr.manager@gmail.com", "role": "government", "name": "Vadodara Admin"},
        {"email": "ahmedabad.city@gmail.com", "role": "government", "name": "Ahmedabad Admin"},
        {"email": "surat.aqua@gmail.com", "role": "government", "name": "Surat Admin"},
        {"email": "rajkot.monitoring@gmail.com", "role": "government", "name": "Rajkot Admin"},
        {"email": "bharuch.supervisor@gmail.com", "role": "government", "name": "Bharuch Admin"},
        {"email": "green@ngo.org", "role": "ngo", "name": "Green NGO"},
    ]
    
    for item in corrections:
        email = item["email"]
        print(f"Syncing: {email}")
        try:
            res = supabase.table("users").update({
                "role": item["role"],
                "full_name": item["name"]
            }).eq("email", email).execute()
            
            if res.data:
                print(f"  [SUCCESS] Updated {email} to {item['role']} ({item['name']})")
            else:
                print(f"  [WARNING] No record found in public.users for {email}")
        except Exception as e:
            print(f"  [ERROR] Failed to sync {email}: {e}")

if __name__ == "__main__":
    sync_roles()
