"""
Script to add government users for Gujarat cities with jurisdiction mapping
Creates government accounts for:
- Vadodara (GOV_VDR_001)
- Ahmedabad (GOV_AMD_001)
- Bharuch (GOV_BHR_001)
- Surat (GOV_SRT_001)
- Rajkot (GOV_RJK_001)
"""

import sys
import os
from pathlib import Path
import time

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

from db.supabase import supabase
from middleware.logging import logger

# Gujarat government users with their jurisdictions
GUJARAT_GOVERNMENTS = [
    {
        "email": "admin@vadodara.gov.in",
        "password": "Vadodara@123",
        "name": "Vadodara Municipal Corporation",
        "role": "government",
        "government_code": "GOV_VDR_001",
        "city_name": "Vadodara",
        "boundary_data": {
            "type": "city",
            "cities": ["Vadodara", "Baroda"],
            "coordinates": {
                "lat": 22.3072,
                "lng": 73.1812,
                "radius_km": 50
            }
        }
    },
    {
        "email": "admin@ahmedabad.gov.in",
        "password": "Ahmedabad@123",
        "name": "Ahmedabad Municipal Corporation",
        "role": "government",
        "government_code": "GOV_AMD_001",
        "city_name": "Ahmedabad",
        "boundary_data": {
            "type": "city",
            "cities": ["Ahmedabad", "Amdavad"],
            "coordinates": {
                "lat": 23.0225,
                "lng": 72.5714,
                "radius_km": 50
            }
        }
    },
    {
        "email": "admin@bharuch.gov.in",
        "password": "Bharuch@123",
        "name": "Bharuch Municipal Corporation",
        "role": "government",
        "government_code": "GOV_BHR_001",
        "city_name": "Bharuch",
        "boundary_data": {
            "type": "city",
            "cities": ["Bharuch", "Broach"],
            "coordinates": {
                "lat": 21.7051,
                "lng": 72.9959,
                "radius_km": 40
            }
        }
    },
    {
        "email": "admin@surat.gov.in",
        "password": "Surat@123",
        "name": "Surat Municipal Corporation",
        "role": "government",
        "government_code": "GOV_SRT_001",
        "city_name": "Surat",
        "boundary_data": {
            "type": "city",
            "cities": ["Surat"],
            "coordinates": {
                "lat": 21.1702,
                "lng": 72.8311,
                "radius_km": 45
            }
        }
    },
    {
        "email": "admin@rajkot.gov.in",
        "password": "Rajkot@123",
        "name": "Rajkot Municipal Corporation",
        "role": "government",
        "government_code": "GOV_RJK_001",
        "city_name": "Rajkot",
        "boundary_data": {
            "type": "city",
            "cities": ["Rajkot"],
            "coordinates": {
                "lat": 22.3039,
                "lng": 70.8022,
                "radius_km": 40
            }
        }
    }
]

def add_gujarat_governments():
    """Add Gujarat government users with jurisdiction mapping"""
    print("=" * 60)
    print("Adding Gujarat Government Users")
    print("=" * 60)
    
    success_count = 0
    error_count = 0
    
    for idx, govt_data in enumerate(GUJARAT_GOVERNMENTS):
        email = govt_data["email"]
        password = govt_data["password"]
        name = govt_data["name"]
        role = govt_data["role"]
        govt_code = govt_data["government_code"]
        city_name = govt_data["city_name"]
        boundary_data = govt_data["boundary_data"]
        
        # Wait 3 seconds between users to avoid rate limit
        if idx > 0:
            print(f"\n[*] Waiting 3 seconds to avoid rate limit...")
            time.sleep(3)
        
        print(f"\n[*] Processing: {email} ({govt_code})")
        
        try:
            # Step 1: Create auth user
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
            
            # Step 2: Create profile entry in users table
            try:
                profile_data = {
                    "id": user_id,
                    "email": email,
                    "full_name": name,
                    "role": role
                }
                
                supabase.table("users").upsert(profile_data, on_conflict="id").execute()
                print(f"   [OK] Profile created with role: {role}")
                
            except Exception as profile_err:
                print(f"   [WARN] Profile creation failed: {profile_err}")
                print(f"   [INFO] Continuing with jurisdiction setup...")
            
            # Step 3: Create jurisdiction mapping
            try:
                jurisdiction_data = {
                    "government_user_id": user_id,
                    "government_code": govt_code,
                    "city_name": city_name,
                    "state": "Gujarat",
                    "boundary_type": "city",
                    "boundary_data": boundary_data
                }
                
                supabase.table("government_jurisdictions").insert(jurisdiction_data).execute()
                print(f"   [OK] Jurisdiction created: {city_name} ({govt_code})")
                success_count += 1
                
            except Exception as jurisdiction_err:
                print(f"   [ERROR] Jurisdiction creation failed: {jurisdiction_err}")
                error_count += 1
                
        except Exception as e:
            error_str = str(e).lower()
            
            if "already registered" in error_str or "already exists" in error_str:
                print(f"   [INFO] User already exists - skipping")
                success_count += 1
            elif "rate limit" in error_str:
                print(f"   [ERROR] Rate limit - try again later")
                error_count += 1
            else:
                print(f"   [ERROR] Error: {e}")
                error_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"[OK] Successful: {success_count}/{len(GUJARAT_GOVERNMENTS)}")
    print(f"[ERROR] Failed: {error_count}/{len(GUJARAT_GOVERNMENTS)}")
    print("=" * 60)
    
    return success_count, error_count

if __name__ == "__main__":
    try:
        print("\n[INFO] Make sure you have run the migration scripts first:")
        print("  1. fix_reports_schema.sql")
        print("  2. government_jurisdictions.sql")
        print("\nPress Ctrl+C to cancel, or wait 5 seconds to continue...")
        time.sleep(5)
        
        success, errors = add_gujarat_governments()
        
        if errors == 0:
            print("\n[SUCCESS] All Gujarat government users added successfully!")
            sys.exit(0)
        else:
            print(f"\n[WARN] Completed with {errors} error(s)")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n[INFO] Cancelled by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Script failed: {e}", exc_info=True)
        print(f"\n[FATAL] Script failed: {e}")
        sys.exit(1)
