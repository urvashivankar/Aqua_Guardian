import sys
import os
import pathlib

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def seed_jurisdictions():
    # 1. Define Jurisdictions with Centers
    jurisdictions = [
        {"city_name": "Vadodara", "gov_email": "vdr.manager@gmail.com", "code": "VMC", "lat": 22.3072, "lng": 73.1812},
        {"city_name": "Ahmedabad", "gov_email": "ahmedabad.city@gmail.com", "code": "AMC", "lat": 23.0225, "lng": 72.5714},
        {"city_name": "Surat", "gov_email": "surat.aqua@gmail.com", "code": "SMC", "lat": 21.1702, "lng": 72.8311},
        {"city_name": "Rajkot", "gov_email": "rajkot.monitoring@gmail.com", "code": "RMC", "lat": 22.3039, "lng": 70.8022},
        {"city_name": "Bharuch", "gov_email": "bharuch.supervisor@gmail.com", "code": "BMA", "lat": 21.7051, "lng": 72.9959},
    ]

    try:
        # Get users to get IDs
        user_res = supabase.table("users").select("id, email").eq("role", "government").execute()
        email_to_id = {u['email']: u['id'] for u in user_res.data}

        # Clear existing (just in case)
        # supabase.table("government_jurisdictions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

        for j in jurisdictions:
            email = j["gov_email"]
            if email in email_to_id:
                user_id = email_to_id[email]
                print(f"Creating jurisdiction for {j['city_name']} (User: {email})")
                
                # Insert jurisdiction
                jur_payload = {
                    "government_user_id": user_id,
                    "city_name": j["city_name"],
                    "government_code": j["code"],
                    "boundary_data": [j["city_name"]], # Using city name in array as per schema comment
                    "state": "Gujarat"
                }
                res = supabase.table("government_jurisdictions").upsert(jur_payload, on_conflict="government_code").execute()
                jur_id = res.data[0]['id']
                print(f"  Jurisdiction ID: {jur_id}")

                # Link reports that mention this city in description
                print(f"  Linking reports for {j['city_name']}...")
                link_res = supabase.table("reports").update({"government_id": jur_id})\
                    .ilike("description", f"%{j['city_name']}%")\
                    .execute()
                print(f"  Linked {len(link_res.data)} reports.")
            else:
                print(f"Warning: User {email} not found")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_jurisdictions()
