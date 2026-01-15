import sys
import os
import pathlib

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def final_verify():
    print("--- Aqua Guardian Final Credential Check ---")
    
    accounts = [
        {"email": "alex@citizen.com", "password": "Citizen@123", "role": "citizen"},
        {"email": "green@ngo.org", "password": "Ngo@123", "role": "ngo"},
        {"email": "admin@vadodara.gov.in", "password": "Vadodara@123", "role": "government"},
        {"email": "admin@ahmedabad.gov.in", "password": "Ahmedabad@123", "role": "government"},
        {"email": "admin@surat.gov.in", "password": "Surat@123", "role": "government"},
        {"email": "admin@rajkot.gov.in", "password": "Rajkot@123", "role": "government"},
        {"email": "admin@bharuch.gov.in", "password": "Bharuch@123", "role": "government"},
    ]
    
    success_count = 0
    
    for account in accounts:
        email = account["email"]
        password = account["password"]
        
        try:
            # Attempt to sign in
            res = supabase.auth.sign_in_with_password({"email": email, "password": password})
            if res.user:
                print(f"[OK] {email} logged in successfully!")
                success_count += 1
            else:
                print(f"[FAIL] {email} login failed (no user returned).")
        except Exception as e:
            print(f"[FAIL] {email} login failed: {e}")
            
    print(f"\n--- Final Status: {success_count}/{len(accounts)} accounts working. ---")

if __name__ == "__main__":
    final_verify()
