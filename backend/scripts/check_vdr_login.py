import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("🔍 Checking Vadodara account...")
print("=" * 50)

# Check auth.users
try:
    # List all users with email containing 'vdr'
    response = supabase.auth.admin.list_users()
    
    vdr_user = None
    for user in response:
        if 'vdr' in user.email.lower():
            vdr_user = user
            print(f"\n✅ Found in auth.users:")
            print(f"   ID: {user.id}")
            print(f"   Email: {user.email}")
            print(f"   Email Confirmed: {user.email_confirmed_at is not None}")
            print(f"   Created: {user.created_at}")
            print(f"   User Metadata: {user.user_metadata}")
            break
    
    if not vdr_user:
        print("\n❌ User NOT found in auth.users!")
        sys.exit(1)
    
    # Check public.users
    public_user = supabase.table("users").select("*").eq("id", vdr_user.id).execute()
    
    if public_user.data:
        print(f"\n✅ Found in public.users:")
        print(f"   Name: {public_user.data[0].get('name')}")
        print(f"   Role: {public_user.data[0].get('role')}")
        print(f"   Email: {public_user.data[0].get('email')}")
    else:
        print(f"\n⚠️  NOT found in public.users!")
    
    # Try to sign in
    print(f"\n🔐 Testing login with Password123!...")
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": vdr_user.email,
            "password": "Password123!"
        })
        print("✅ Login SUCCESSFUL!")
        print(f"   Session: {auth_response.session is not None}")
    except Exception as e:
        print(f"❌ Login FAILED: {str(e)}")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
