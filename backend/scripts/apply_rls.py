import sys
import os
import pathlib

# Add parent directory to path to import modules
sys.path.append(str(pathlib.Path.cwd() / 'backend'))

from db.supabase import supabase

def apply_sql(sql_content):
    try:
        # Supabase Python client doesn't have a direct 'rpc' for raw SQL 
        # unless we create a function. But we can use the bypass if we have the key.
        # However, the best way to apply RLS policies is via the dashboard or a migration tool.
        # Since I am an agent, I will try to use a script that uses the postgres connection if possible,
        # but in this environment, I usually only have the API.
        
        # ACTUALLY, I can use the 'service_role' key to bypass RLS in the app logic,
        # or I can try to use a specialized RPC if one exists.
        
        # Wait, I have an even simpler fix: 
        # If I can't apply SQL, I should update the backend logic to use the admin client
        # for these specific lookup queries.
        
        print("Attempting to apply RLS policies via SQL...")
        # Note: This might fail if RPC 'exec_sql' doesn't exist.
        res = supabase.rpc('exec_sql', {'sql_query': sql_content}).execute()
        print("SQL Applied successfully (via RPC).")
    except Exception as e:
        print(f"Error applying SQL via RPC: {e}")
        print("Falling back to manual check...")

if __name__ == "__main__":
    sql_path = pathlib.Path.cwd() / 'backend' / 'db' / 'relax_rls.sql'
    if sql_path.exists():
        with open(sql_path, 'r') as f:
            content = f.read()
            # print(content)
            # apply_sql(content)
    else:
        print("SQL file not found.")
