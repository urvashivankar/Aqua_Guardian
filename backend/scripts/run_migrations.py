"""
Helper script to execute SQL migrations on Supabase
Run this to apply database schema changes
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from db.supabase import supabase
from middleware.logging import logger

def read_sql_file(filename):
    """Read SQL file content"""
    sql_path = Path(__file__).parent.parent / "db" / filename
    with open(sql_path, 'r', encoding='utf-8') as f:
        return f.read()

def execute_sql(sql_content, description):
    """Execute SQL via Supabase RPC"""
    print(f"\n[*] Executing: {description}")
    try:
        # Note: Supabase Python client doesn't support direct SQL execution
        # You need to run these in Supabase SQL Editor
        print(f"[INFO] SQL content prepared. Please run this in Supabase SQL Editor:")
        print("=" * 60)
        print(sql_content)
        print("=" * 60)
        return True
    except Exception as e:
        print(f"[ERROR] Failed: {e}")
        return False

def main():
    print("=" * 60)
    print("Database Migration Helper")
    print("=" * 60)
    print("\n[INFO] This script will prepare SQL migrations for execution.")
    print("[INFO] You need to run these in Supabase Dashboard > SQL Editor")
    print("\nMigrations to run:")
    print("1. fix_reports_schema.sql - Fix user_id foreign key")
    print("2. government_jurisdictions.sql - Create jurisdiction system")
    
    input("\nPress Enter to view migration SQL...")
    
    # Read and display migrations
    migrations = [
        ("fix_reports_schema.sql", "Fix reports table schema"),
        ("government_jurisdictions.sql", "Create government jurisdictions table")
    ]
    
    for filename, description in migrations:
        try:
            sql_content = read_sql_file(filename)
            execute_sql(sql_content, description)
            input("\nPress Enter to continue to next migration...")
        except Exception as e:
            print(f"[ERROR] Failed to read {filename}: {e}")
    
    print("\n" + "=" * 60)
    print("Migration SQL Prepared")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Copy the SQL from above")
    print("2. Go to Supabase Dashboard > SQL Editor")
    print("3. Paste and execute each migration")
    print("4. Run: python scripts\\add_gujarat_governments.py")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INFO] Cancelled by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Script failed: {e}", exc_info=True)
        print(f"\n[FATAL] Script failed: {e}")
        sys.exit(1)
