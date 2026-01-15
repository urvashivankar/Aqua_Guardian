import sys
import os
import pathlib
import requests

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def simulate_frontend():
    email = "vdr.manager@gmail.com"
    password = "password123" # Verified in demo_credentials.md
    
    print(f"--- Simulating Frontend for {email} ---")
    
    # 1. Login to get token
    try:
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        token = res.session.access_token
        print("✅ Login Successful. Token retrieved.")
    except Exception as e:
        print(f"❌ Login Failed: {e}")
        return

    # 2. Call Backend API
    api_url = "http://127.0.0.1:8000/dashboard/government/stats"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\nCalling Backend API: {api_url}...")
    try:
        response = requests.get(api_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
    except Exception as e:
        print(f"❌ API Call Failed: {e}")

if __name__ == "__main__":
    simulate_frontend()
