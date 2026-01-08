import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pathlib
from middleware.logging import logger

# Explicitly load .env from the same directory as this file or parent
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url: str = os.environ.get("SUPABASE_URL", "")

# AGGRESSIVE CLEANUP: Clear legacy keys that might interfere with authentication
if "SUPABASE_KEY" in os.environ:
    del os.environ["SUPABASE_KEY"]
if "SUPABASE_SERVICE_ROLE_KEY" in os.environ:
    del os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Use the new Secret Key format required for NANO projects
key: str = os.environ.get("SUPABASE_SECRET_KEY", "")

try:
    supabase: Client = create_client(url, key)
except Exception as e:
    logger.error(f"❌ Failed to initialize Supabase client: {e}")
    raise e
