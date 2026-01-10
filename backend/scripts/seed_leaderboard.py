import os
import random
import uuid
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

# Load env vars
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing Supabase credentials.")
    exit(1)

supabase = create_client(url, key)

def seed_leaderboard():
    print("--- Seeding Leaderboard Data ---")

    # 1. Create Mock Users
    mock_users = [
        {"email": "alex.citizen@example.com", "name": "Alex Citizen", "role": "citizen"},
        {"email": "sarah.ngo@example.com", "name": "Sarah NGO", "role": "ngo"},
        {"email": "mike.gov@example.com", "name": "Mike Gov", "role": "government"},
        {"email": "river.guardian@example.com", "name": "River Guardian", "role": "citizen"},
        {"email": "ocean.lover@example.com", "name": "Ocean Lover", "role": "citizen"}
    ]

    created_users = []

    for u in mock_users:
        # Check if exists in public.users (assuming auth.users creation is skipped or they mirror real auth users)
        # For simplicity, we'll just upsert into public.users. 
        # Note: In real app, they must exist in auth.users first.
        # We will assume these are "ghost" users for the leaderboard or try to find them.
        # Actually, let's just make up UUIDs for visual purposes if foreign keys allow, 
        # BUT foreign keys usually enforce auth.users. 
        # Triggering `auth.sign_up` via API might be blocked or require email verification.
        # So, we will fetch *existing* users from auth.users and update them, 
        # OR create fake entries in public.users if the constraint isn't strict (it usually is).
        
        # STRATEGY: List existing auth users. If not enough, we can't easily create them without admin SDK privileges on auth.
        # However, we have SERVICE_ROLE_KEY, so we can use `supabase.auth.admin.create_user`.
        
        try:
            # Try to create user in Auth
            try:
                auth_user = supabase.auth.admin.create_user({
                    "email": u["email"],
                    "password": "password123",
                    "email_confirm": True
                })
                user_id = auth_user.user.id
                print(f"Created Auth User: {u['email']} -> {user_id}")
            except Exception as e:
                # If already exists, assume we can fetch it? or it acts weird. 
                # Let's try to sign in or get user by email? Admin list users is better.
                # Simplest: Just catch error, assume user exists, and we need their ID.
                # We can list users to find the ID.
                print(f"User {u['email']} might already exist or error: {e}")
                # Fallback: List all users and find match
                users_list = supabase.auth.admin.list_users()
                found = next((x for x in users_list if x.email == u["email"]), None)
                if found:
                    user_id = found.id
                else:
                    # Just use a random UUID if we can't find/create (might fail if FK constraint)
                    # user_id = str(uuid.uuid4())
                    continue # Skip if we can't get an ID

            created_users.append({"id": user_id, **u})

            # Upsert public profile
            supabase.table("users").upsert({
                "id": user_id,
                "email": u["email"],
                "name": u["name"],
                "role": u["role"]
            }).execute()

        except Exception as e:
            print(f"Skipping user {u['email']}: {e}")

    # 2. Assign Points & cleanups
    for user in created_users:
        uid = user["id"]
        
        # Points
        points = random.randint(100, 5000)
        supabase.table("user_points").upsert({
            "user_id": uid,
            "total_points": points,
            "updated_at": datetime.now().isoformat()
        }).execute()
        print(f"Awarded {points} points to {user['name']}")

        # Verified Reports (Create dummy reports)
        # rewards.py counts status='verified' reports
        for _ in range(random.randint(1, 10)):
             supabase.table("reports").insert({
                "user_id": uid,
                "status": "verified",
                "latitude": 0,
                "longitude": 0,
                "description": "Mock verified report",
                "severity": 5,
                "ai_class": "plastic",
                "ai_confidence": 0.95
             }).execute()
        
        # Cleanup Participation (Create dummy rows if table exists)
        # We need a 'cleanup_events' id first usually.
        # Let's mock a cleanup event first.
        try:
            evt = supabase.table("cleanup_events").insert({
               "title": "Mock Cleanup",
               "location": "Beach",
               "date": datetime.now().isoformat(),
               "organizer_id": uid,
               "status": "completed"
            }).execute()
            
            if evt.data:
                evt_id = evt.data[0]['id']
                # Add participation
                supabase.table("cleanup_participants").insert({
                    "cleanup_id": evt_id,
                    "user_id": uid,
                    "status": "completed"
                }).execute()
        except Exception as e:
            print(f"Cleanup seeding issue (might be ignoring): {e}")

    print("--- Leaderboard Seeded Successfully ---")

if __name__ == "__main__":
    seed_leaderboard()
