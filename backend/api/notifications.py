from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db.supabase import supabase
from utils.auth_utils import get_current_user
from pywebpush import webpush, WebPushException
import json
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# VAPID Keys should ideally be in .env
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_CLAIM_EMAIL = os.getenv("GOVT_EMAIL", "admin@aquaguardian.org")

class PushSubscription(BaseModel):
    subscription_json: dict
    device_type: str = "web"

@router.post("/subscribe")
def subscribe(sub_data: PushSubscription, current_user = Depends(get_current_user)):
    """Save a user's push subscription to the database."""
    try:
        res = supabase.table("push_subscriptions").upsert({
            "user_id": current_user.id,
            "subscription": sub_data.subscription_json,
            "device_type": sub_data.device_type
        }).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        logger.error(f"Failed to subscribe: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def send_push_notification(user_id: str, title: str, message: str, url: str = "/"):
    """Internal utility to send a push notification to all of a user's devices."""
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not configured. Push notification skipped.")
        return

    try:
        # Fetch all active subscriptions for the user
        subs = supabase.table("push_subscriptions").select("subscription").eq("user_id", user_id).execute()
        
        if not subs.data:
            return

        payload = json.dumps({
            "title": title,
            "body": message,
            "url": url,
            "icon": "/logo192.png", # Standard PWA icon path
            "badge": "/badge.png"
        })

        for row in subs.data:
            subscription_info = row["subscription"]
            try:
                webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": f"mailto:{VAPID_CLAIM_EMAIL}"}
                )
            except WebPushException as ex:
                # If subscription is expired or invalid, we could remove it
                if ex.response and ex.response.status_code in [404, 410]:
                    logger.info(f"Removing invalid subscription for user {user_id}")
                    # In a real app, delete this specific subscription
                else:
                    logger.error(f"WebPush error: {ex}")
            except Exception as e:
                logger.error(f"Unexpected error in webpush: {e}")

    except Exception as e:
        logger.error(f"Failed to send push: {e}")
