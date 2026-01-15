from fastapi import APIRouter, HTTPException
from db.supabase import supabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/leaderboard")
def get_leaderboard(limit: int = 10):
    """Fetch the top contributors from the community."""
    try:
        # Query the leaderboard view we created
        res = supabase.table("leaderboard").select("*").limit(limit).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))
