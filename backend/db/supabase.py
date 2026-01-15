import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pathlib
from middleware.logging import logger

# Explicitly load .env from the same directory as this file or parent
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url: str = os.environ.get("SUPABASE_URL", "")

# Supabase uses the "Secret Key" (prefixed with sb_secret_) for administrative access in Nano.
key: str = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_KEY", "")

if not key:
    logger.error("❌ No Supabase Key found! Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.")
else:
    key_type = "Service Role Key" if "service_role" in key.lower() or "sb_secret_" in key else "Restricted Key"
    logger.info(f"🔑 Initializing Supabase client with {key_type}")

try:
    supabase: Client = create_client(url, key)
except Exception as e:
    logger.error(f"❌ Failed to initialize Supabase client: {e}")
    raise e
