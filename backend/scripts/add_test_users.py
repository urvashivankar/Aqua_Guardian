"""
Script to add test users to Supabase database
Users from the provided image:
1. Government: admin@city.gov / Admin@123
2. Citizen: alex@citizen.com / Citizen@123
3. NGO: green@ngo.org / Ngo@123

Additional test users:
4. Government: water@dept.gov / Water@123
5. Citizen: john@example.com / John@123
6. NGO: ocean@cleanup.org / Ocean@123
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

from db.supabase import supabase
from middleware.logging import logger

# Test users to add
TEST_USERS = [
    # Users from image
    {
        "email": "admin@city.gov",
        "password": "Admin@123",
        "name": "City Admin",
        "role": "government"
    },
    {
        "email": "alex@citizen.com",
        "password": "Citizen@123",
        "name": "Alex Citizen",
        "role": "citizen"
    },
    {
        "email": "green@ngo.org",
        "password": "Ngo@123",
        "name": "Green NGO",
        "role": "ngo"
    },
    # Additional test users
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

def add_test_users():
    """Add test users to Supabase"""
    print("=" * 60)
    print("Adding Test Users to Supabase")
    print("=" * 60)
    
    success_count = 0
    error_count = 0
    
    for user_data in TEST_USERS:
        email = user_data["email"]
        password = user_data["password"]
        name = user_data["name"]
        role = user_data["role"]
        
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
            else:
                print(f"   [ERROR] Error: {e}")
                error_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"[OK] Successful: {success_count}/{len(TEST_USERS)}")
    print(f"[ERROR] Failed: {error_count}/{len(TEST_USERS)}")
    print("=" * 60)
    
    return success_count, error_count

if __name__ == "__main__":
    try:
        success, errors = add_test_users()
        
        if errors == 0:
            print("\n[SUCCESS] All users added successfully!")
            sys.exit(0)
        else:
            print(f"\n[WARN] Completed with {errors} error(s)")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Script failed: {e}", exc_info=True)
        print(f"\n[FATAL] Script failed: {e}")
        sys.exit(1)
