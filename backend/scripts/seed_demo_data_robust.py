import os
import sys
import httpx
import random
import time
from datetime import datetime, timedelta
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

print("🌱 Starting Robust Demo Data Seed (httpx)...")

# 1. Get a valid User ID to assign reports to (green@ngo.org)
print("   Fetching valid user ID...")
user_id = None
try:
    resp = httpx.get(f"{SUPABASE_URL}/rest/v1/users?email=eq.green@ngo.org", headers=HEADERS)
    if resp.status_code == 200 and len(resp.json()) > 0:
        user_id = resp.json()[0]['id']
        print(f"   ✅ Using user: green@ngo.org ({user_id})")
    else:
        # Try to find ANY user
        print("   ⚠️ green@ngo.org not found, fetching any user...")
        resp = httpx.get(f"{SUPABASE_URL}/rest/v1/users?limit=1", headers=HEADERS)
        if resp.status_code == 200 and len(resp.json()) > 0:
            user_id = resp.json()[0]['id']
            print(f"   ✅ Using fallback user: {user_id}")
        else:
            print("   ❌ No users found in public.users! Cannot seed reports.")
            sys.exit(1)
except Exception as e:
    print(f"   ❌ Error fetching user: {e}")
    sys.exit(1)

# 2. Define Gujarat & India Locations
locations = [
    # Gujarat Cities (Critical for Gov Dashboard)
    {"name": "Vishwamitri River, Vadodara", "lat": 22.3072, "lng": 73.1812},
    {"name": "Sursagar Lake, Vadodara", "lat": 22.3008, "lng": 73.2043},
    {"name": "Sabarmati Riverfront, Ahmedabad", "lat": 23.0225, "lng": 72.5714},
    {"name": "Tapi River, Surat", "lat": 21.1702, "lng": 72.8311},
    {"name": "Dumas Beach, Surat", "lat": 21.0688, "lng": 72.7068},
    
    # Rest of India (For NGO Map)
    {"name": "Mumbai Harbor", "lat": 18.9438, "lng": 72.8354},
    {"name": "Juhu Beach", "lat": 19.0988, "lng": 72.8264},
    {"name": "Yamuna River, Delhi", "lat": 28.6139, "lng": 77.2090},
    {"name": "Marina Beach, Chennai", "lat": 13.0500, "lng": 80.2824}
]

pollution_types = ["Industrial Discharge", "Plastic Pollution", "Oil Spill", "Sewage Overflow"]
statuses = ["Submitted", "Verified", "Resolution in Progress", "Resolved", "Verified by AI"]

# 3. Seed Reports
print("   Seeding Reports...")
reports = []
for i in range(15):
    loc = random.choice(locations)
    p_type = random.choice(pollution_types)
    status = random.choice(statuses)
    
    # Vadodara should have some active ones
    if "Vadodara" in loc['name'] and random.random() > 0.3:
        status = "Verified"
    
    reports.append({
        "latitude": loc["lat"] + random.uniform(-0.005, 0.005),
        "longitude": loc["lng"] + random.uniform(-0.005, 0.005),
        "severity": random.randint(4, 10),
        "description": f"Detected {p_type} at {loc['name']}. Looks severe.",
        "user_id": user_id,
        "status": status,
        "created_at": (datetime.now() - timedelta(days=random.randint(0, 10))).isoformat()
    })

try:
    resp = httpx.post(f"{SUPABASE_URL}/rest/v1/reports", headers=HEADERS, json=reports)
    if resp.status_code in [200, 201]:
        print(f"   ✅ Inserted {len(reports)} reports.")
    else:
        print(f"   ❌ Report insert failed: {resp.status_code} {resp.text}")
except Exception as e:
    print(f"   ❌ Report error: {e}")

# 4. Seed Cleanup Events (NGO)
print("   Seeding Cleanup Events...")
events = [
    {
        "title": "Mega Vadodara Cleanup",
        "location_name": "Vishwamitri River",
        "latitude": 22.3072,
        "longitude": 73.1812,
        "description": "City-wide cleanup drive organized by Aqua Guardian.",
        "event_date": (datetime.now() + timedelta(days=5)).isoformat(),
        "status": "upcoming",
        "organizer_id": user_id,
        "max_participants": 100,
        "current_participants": 45
    },
    {
        "title": "Mumbai Beach Rescue",
        "location_name": "Juhu Beach",
        "latitude": 19.0988,
        "longitude": 72.8264,
        "description": "Removing plastic waste after high tide.",
        "event_date": (datetime.now() + timedelta(days=2)).isoformat(),
        "status": "upcoming",
        "organizer_id": user_id,
        "max_participants": 200,
        "current_participants": 120
    }
]

try:
    resp = httpx.post(f"{SUPABASE_URL}/rest/v1/cleanup_events", headers=HEADERS, json=events)
    if resp.status_code in [200, 201]:
        print(f"   ✅ Inserted {len(events)} cleanup events.")
    else:
        # Table might not exist or schema differs, allow fail
        print(f"   ⚠️ Cleanup Event insert failed (might be optional): {resp.status_code}")
except Exception as e:
    print(f"   ❌ Cleanup Event error: {e}")

print("\n🎉 DEMO DATA SEEDED SUCCESSFULLY!")
