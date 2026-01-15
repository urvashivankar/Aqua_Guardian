import sys
import os
import pathlib

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def list_auth_users():
    try:
        users = supabase.auth.admin.list_users()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Confirmed: {u.email_confirmed_at}")
    except Exception as e:
        print(f"Error listing users: {e}")

if __name__ == "__main__":
    list_auth_users()
