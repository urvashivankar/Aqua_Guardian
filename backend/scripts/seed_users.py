import sys
import os
import pathlib
import uvicorn
from dotenv import load_dotenv
from supabase import create_client, Client

# Add parent directory to path to import db module
sys.path.append(str(pathlib.Path(__file__).parent.parent))

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SECRET_KEY", "")

if not url or not key:
    print("❌ Error: SUPABASE_URL or SUPABASE_SECRET_KEY not found in .env")
    sys.exit(1)

try:
    # Initialize Supabase Client
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"❌ Failed to initialize Supabase client: {e}")
    sys.exit(1)

def create_admin_user(email, password, name, role):
    print(f"🚀 Creating User: {email} ({role})...")
    
    try:
        # 1. Create Auth User (Admin API bypassing rate limits)
        # Note: Using sign_up with auto_confirm if possible, or verify manually
        # With Service Role Key, we can use admin_auth methods usually, but the python client wrapper might vary.
        # Let's try standard sign_up first, but normally for admin work we use:
        # supabase.auth.admin.create_user(...)
        
        attributes = {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": name, "role": role}
        }
        
        # Attempt to use admin API if available in this client version
        try:
            user_response = supabase.auth.admin.create_user(attributes)
            user_id = user_response.user.id
            print(f"✅ Auth User Created: {user_id}")
        except Exception as admin_err:
            print(f"⚠️ Admin Create failed ({admin_err}), trying standard signup...")
            res = supabase.auth.sign_up({
                "email": email, 
                "password": password,
                "options": {
                    "data": {"name": name, "role": role}
                }
            })
            if not res.user:
                raise Exception("Signup returned no user")
            user_id = res.user.id
            print(f"✅ Auth User Created (Standard): {user_id}")

        # 2. Insert into Public Profile (if trigger didn't catch it)
        # Note: 'location' column removed as it appears missing in DB schema
        profile_data = {
            "id": user_id,
            "email": email,
            "full_name": name,
            "role": role
        }
        
        # Upsert profile
        supabase.table("users").upsert(profile_data).execute()
        print(f"✅ Public Profile Created/Updated for {role}")
        
    except Exception as e:
        print(f"❌ Failed to create/update user {email}: {e}")

if __name__ == "__main__":
    print("--- 🛡️ Aqua Guardian User Seeder 🛡️ ---")
    create_admin_user("admin@city.gov", "Admin@123", "City Administrator", "government")
    create_admin_user("alex@citizen.com", "Citizen@123", "Alex Citizen", "citizen")
    create_admin_user("green@ngo.org", "Ngo@123", "Green Earth NGO", "ngo")
    print("\n✅ Setup Complete. You can now log in with these credentials.")
