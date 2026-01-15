import sys
import os
import pathlib
import json

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def debug_logins():
    accounts = [
        {"email": "alex@citizen.com", "password": "Citizen@123", "role": "citizen"},
        {"email": "green@ngo.org", "password": "Ngo@123", "role": "ngo"},
        {"email": "admin@vadodara.gov.in", "password": "Vadodara@123", "role": "government"},
        {"email": "admin@ahmedabad.gov.in", "password": "Ahmedabad@123", "role": "government"},
        {"email": "admin@surat.gov.in", "password": "Surat@123", "role": "government"},
        {"email": "admin@rajkot.gov.in", "password": "Rajkot@123", "role": "government"},
        {"email": "admin@bharuch.gov.in", "password": "Bharuch@123", "role": "government"},
    ]
    
    results = []
    
    for account in accounts:
        email = account["email"]
        password = account["password"]
        
        try:
            res = supabase.auth.sign_in_with_password({"email": email, "password": password})
            if res.user:
                results.append(f"[OK] {email}")
            else:
                results.append(f"[FAIL] {email} (No user returned)")
        except Exception as e:
            results.append(f"[FAIL] {email} ({str(e)})")
            
    with open("login_results.txt", "w") as f:
        f.write("\n".join(results))
    
    print("Done. Saved to login_results.txt")

if __name__ == "__main__":
    debug_logins()
