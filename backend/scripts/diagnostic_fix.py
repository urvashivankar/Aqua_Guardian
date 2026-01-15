import sys
import os
import pathlib
import time

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path(__file__).parent.parent))

from db.supabase import supabase

def diagnostic_and_fix():
    print("--- 🩺 Aqua Guardian Diagnostic & Fix 🩺 ---")
    
    demo_emails = [
        "alex@citizen.com",
        "green@ngo.org",
        "admin@vadodara.gov.in",
        "admin@ahmedabad.gov.in",
        "admin@surat.gov.in",
        "admin@rajkot.gov.in",
        "admin@bharuch.gov.in"
    ]
    
    passwords = {
        "alex@citizen.com": "Citizen@123",
        "green@ngo.org": "Ngo@123",
        "admin@vadodara.gov.in": "Vadodara@123",
        "admin@ahmedabad.gov.in": "Ahmedabad@123",
        "admin@surat.gov.in": "Surat@123",
        "admin@rajkot.gov.in": "Rajkot@123",
        "admin@bharuch.gov.in": "Bharuch@123"
    }

    try:
        # 1. Fetch current Auth users
        print("[*] Fetching Auth users...")
        auth_users = supabase.auth.admin.list_users()
        auth_map = {u.email: u for u in auth_users}
        
        # 2. Fetch current Public users
        print("[*] Fetching Public users...")
        public_res = supabase.table("users").select("id, email").execute()
        public_map = {u['email']: u['id'] for u in public_res.data}

        for email in demo_emails:
            print(f"\n[?] Checking: {email}")
            
            in_auth = email in auth_map
            in_public = email in public_map
            
            print(f"    - In Auth: {in_auth} (ID: {auth_map[email].id if in_auth else 'N/A'})")
            print(f"    - In Public: {in_public} (ID: {public_map[email] if in_public else 'N/A'})")

            # CASE 1: In both, but ID mismatch
            if in_auth and in_public and auth_map[email].id != public_map[email]:
                print("    [!] ID MISMATCH! Deleting both to reset.")
                supabase.table("users").delete().eq("email", email).execute()
                supabase.auth.admin.delete_user(auth_map[email].id)
                in_auth = in_public = False

            # CASE 2: In Public but not in Auth (The most common "Database Error" cause)
            if in_public and not in_auth:
                print("    [!] Ghost record in Public! Deleting public record.")
                supabase.table("users").delete().eq("email", email).execute()
                in_public = False

            # After cleanup, if not in Auth, create it
            if not in_auth:
                print(f"    [+] Re-creating Auth user for {email}...")
                role = "government" if ".gov" in email else "citizen" if "alex" in email else "ngo"
                name = email.split('@')[0].capitalize()
                
                try:
                    res = supabase.auth.admin.create_user({
                        "email": email,
                        "password": passwords[email],
                        "email_confirm": True,
                        "user_metadata": {"role": role, "full_name": name}
                    })
                    new_id = res.user.id
                    print(f"    [OK] New Auth ID: {new_id}")
                    
                    # Also insert into public users
                    supabase.table("users").upsert({
                        "id": new_id,
                        "email": email,
                        "role": role,
                        "full_name": name
                    }).execute()
                    print("    [OK] Public record synced.")
                except Exception as e:
                    print(f"    [ERROR] Failed to create: {e}")
            else:
                # If in Auth, just force update password
                print(f"    [+] Force-updating existing Auth user password...")
                supabase.auth.admin.update_user_by_id(auth_map[email].id, {"password": passwords[email], "email_confirm": True})
                print("    [OK] Password set.")

    except Exception as e:
        print(f"\n[FATAL] Script error: {e}")

if __name__ == "__main__":
    diagnostic_and_fix()
