import os
import sys
import httpx
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Missing SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

EMAIL = "green@ngo.org"

print(f"🔄 Converting {EMAIL} to Vadodara Government Admin...")

try:
    # 1. Find the User ID from public.users
    print(f"   Searching for user: {EMAIL}")
    resp = httpx.get(f"{SUPABASE_URL}/rest/v1/users?email=eq.{EMAIL}", headers=HEADERS)
    
    if resp.status_code != 200:
        print(f"❌ Failed to find user: {resp.status_code} {resp.text}")
        sys.exit(1)
        
    users = resp.json()
    if not users:
        print("❌ User not found in public.users!")
        sys.exit(1)
        
    user_id = users[0]['id']
    print(f"✅ Found User ID: {user_id}")
    
    # 2. Update Role in public.users
    print("   Updating role to 'government'...")
    update_payload = {
        "role": "government",
        "name": "Vadodara Admin",
        "full_name": "Vadodara Municipal Admin"
    }
    
    update_resp = httpx.patch(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
        headers=HEADERS,
        json=update_payload
    )
    
    if update_resp.status_code in [200, 204]:
        print("✅ Role updated successfully in public.users")
    else:
        print(f"❌ Failed to update role: {update_resp.status_code} {update_resp.text}")
        sys.exit(1)

    # 3. Link to Vadodara Jurisdiction
    print("   Linking to Vadodara Jurisdiction...")
    # Find Vadodara
    j_resp = httpx.get(f"{SUPABASE_URL}/rest/v1/government_jurisdictions?city_name=ilike.*Vadodara*", headers=HEADERS)
    
    if j_resp.status_code == 200 and len(j_resp.json()) > 0:
        jid = j_resp.json()[0]['id']
        print(f"   Found Jurisdiction ID: {jid}")
        
        # Link
        link_resp = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/government_jurisdictions?id=eq.{jid}",
            headers=HEADERS,
            json={"government_user_id": user_id}
        )
        
        if link_resp.status_code in [200, 204]:
            print(f"✅ Successfully linked to Vadodara!")
        else:
            print(f"❌ Link failed: {link_resp.status_code} {link_resp.text}")
    else:
        print("❌ Vadodara jurisdiction not found")

    print("\n🎉 CONVERSION COMPLETE!")
    print(f"User {EMAIL} is now the Vadodara Admin.")
    print("👉 Please REFRESH the dashboard to see changes.")

except Exception as e:
    print(f"❌ Exception: {str(e)}")
