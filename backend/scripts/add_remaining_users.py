"""
Script to add remaining test users that failed due to rate limit
"""

import sys
import os
from pathlib import Path
import time

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

from db.supabase import supabase
from middleware.logging import logger

# Remaining users that failed due to rate limit
REMAINING_USERS = [
    {
        "email": "admin@city.gov",
        "password": "Admin@123",
        "name": "City Admin",
        "role": "government"
    },
    {
        "email": "water@dept.gov",
        "password": "Water@123",
        "name": "Water Department",
        "role": "government"
    },
    {
        "email": "john@example.com",
        "password": "John@123",
        "name": "John Doe",
        "role": "citizen"
    },
    {
        "email": "ocean@cleanup.org",
        "password": "Ocean@123",
        "name": "Ocean Cleanup Initiative",
        "role": "ngo"
    }
]

def add_remaining_users():
    """Add remaining test users to Supabase with delays to avoid rate limit"""
    print("=" * 60)
    print("Adding Remaining Test Users to Supabase")
    print("Waiting between each user to avoid rate limits...")
    print("=" * 60)
    
    success_count = 0
    error_count = 0
    
    for idx, user_data in enumerate(REMAINING_USERS):
        email = user_data["email"]
        password = user_data["password"]
        name = user_data["name"]
        role = user_data["role"]
        
        # Wait 3 seconds between users to avoid rate limit
        if idx > 0:
            print(f"\n[*] Waiting 3 seconds to avoid rate limit...")
            time.sleep(3)
        
        print(f"\n[*] Processing: {email} ({role})")
        
        try:
            # Sign up user with Supabase Auth
            res = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "name": name,
                        "role": role
                    }
                }
            })
            
            if not res.user:
                print(f"   [ERROR] Failed: No user data returned")
                error_count += 1
                continue
            
            user_id = res.user.id
            print(f"   [OK] Auth user created - ID: {user_id}")
            
            # Create profile entry in users table
            try:
                profile_data = {
                    "id": user_id,
                    "email": email,
                    "full_name": name,
                    "role": role
                }
                
                supabase.table("users").upsert(profile_data, on_conflict="id").execute()
                print(f"   [OK] Profile created with role: {role}")
                success_count += 1
                
            except Exception as profile_err:
                print(f"   [WARN] Profile creation failed: {profile_err}")
                print(f"   [INFO] Auth user exists but profile may be incomplete")
                success_count += 1  # Still count as success since auth user was created
                
        except Exception as e:
            error_str = str(e).lower()
            
            if "already registered" in error_str or "already exists" in error_str:
                print(f"   [INFO] User already exists - skipping")
                success_count += 1
            elif "rate limit" in error_str:
                print(f"   [ERROR] Rate limit still active - try again later")
                error_count += 1
            else:
                print(f"   [ERROR] Error: {e}")
                error_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"[OK] Successful: {success_count}/{len(REMAINING_USERS)}")
    print(f"[ERROR] Failed: {error_count}/{len(REMAINING_USERS)}")
    print("=" * 60)
    
    return success_count, error_count

if __name__ == "__main__":
    try:
        success, errors = add_remaining_users()
        
        if errors == 0:
            print("\n[SUCCESS] All remaining users added successfully!")
            sys.exit(0)
        else:
            print(f"\n[WARN] Completed with {errors} error(s)")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Script failed: {e}", exc_info=True)
        print(f"\n[FATAL] Script failed: {e}")
        sys.exit(1)
