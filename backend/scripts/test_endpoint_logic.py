import sys
import os
import pathlib

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def diag_logic():
    user_id = "3635755e-fb29-4a02-91bf-b94078935c10" # Vadodara Admin ID
    email = "vdr.manager@gmail.com"
    
    print(f"--- Diag for User: {email} ({user_id}) ---")
    
    # 1. Test Jurisdiction Lookup (Same logic as dashboard.py)
    print("\n1. Looking up jurisdiction...")
    jurisdiction_res = supabase.table("government_jurisdictions")\
        .select("id, city_name")\
        .eq("government_user_id", user_id)\
        .execute()
    
    if not jurisdiction_res.data:
        print("FAIL: No jurisdiction found!")
        # Try a broader search to see what's in there
        all_jurs = supabase.table("government_jurisdictions").select("*").execute()
        print(f"All Jurisdictions in DB: {len(all_jurs.data)}")
        for j in all_jurs.data:
            print(f"  - {j['city_name']}: {j['government_user_id']} ({j['id']})")
        return
    
    print(f"Found {len(jurisdiction_res.data)} jurisdictions for this user.")
    for jur in jurisdiction_res.data:
        jurisdiction_id = jur["id"]
        print(f"CHECKING Jurisdiction: {jur['city_name']} ({jurisdiction_id})")
        
        # 2. Test Report Counting
        # Any reports?
        any_res = supabase.table("reports").select("id", count="exact").eq("government_id", jurisdiction_id).execute()
        print(f"  Total reports for this Jur: {any_res.count}")
        
        # By Status
        status_res = supabase.table("reports")\
            .select("id, status, severity")\
            .eq("government_id", jurisdiction_id)\
            .execute()
        print(f"  Reports detail:")
        for r in status_res.data:
            print(f"    - ID: {r['id']} | Status: {r['status']} | Severity: {r['severity']}")

    # 3. Overall Reports Check
    print("\n3. Testing overall reports linkage check...")
    reports_res = supabase.table("reports")\
        .select("id, description, government_id")\
        .ilike("description", "%Vadodara%")\
        .execute()
    print(f"Reports matching 'Vadodara': {len(reports_res.data)}")
    for r in reports_res.data:
        print(f"  - ID: {r['id']} | GovID: {r['government_id']}")

if __name__ == "__main__":
    diag_logic()
