import sys
import os
import pathlib

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def test_domain_signup():
    print("Testing signup with citizen.com domain but government role...")
    test_email = "government_test@citizen.com"
    test_pass = "Test@123"
    
    try:
        # 1. Try create_user (Admin)
        try:
            res = supabase.auth.admin.create_user({
                "email": test_email,
                "password": test_pass,
                "email_confirm": True,
                "user_metadata": {"role": "government", "full_name": "Test Gov"}
            })
            if res.user:
                print(f"[OK] Admin create_user worked for {test_email}")
                return
        except Exception as admin_err:
            print(f"[FAIL] Admin create_user failed: {admin_err}")
            
        # 2. Try regular sign_up
        print("Trying regular sign_up...")
        res = supabase.auth.sign_up({
            "email": test_email,
            "password": test_pass,
            "options": {"data": {"role": "government", "full_name": "Test Gov"}}
        })
        if res.user:
            print(f"[OK] Regular sign_up worked for {test_email}")
        else:
            print(f"[FAIL] Regular sign_up returned no user")
            
    except Exception as e:
        print(f"[ERROR] Global failure: {e}")

if __name__ == "__main__":
    test_domain_signup()
