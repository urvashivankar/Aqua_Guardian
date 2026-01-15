from fastapi import APIRouter, HTTPException, Form, UploadFile, File
from typing import List, Optional
from datetime import datetime
from db.supabase import supabase
from db.models import ReportDiscussion, ReportDiscussionCreate
from middleware.logging import logger
from utils.storage import upload_file, get_public_url
from fastapi import Depends
from utils.auth_utils import get_current_user

router = APIRouter()

VALID_TYPES = {
    "citizen": ["CLARIFICATION", "PROOF_UPLOAD"],
    "ngo": ["FIELD_UPDATE", "PROOF_UPLOAD"],
    "government": ["INFO_REQUEST", "STATUS_UPDATE", "PROOF_UPLOAD", "CLOSURE_NOTE"]
}

@router.post("/{report_id}/discussions", response_model=ReportDiscussion)
async def add_discussion(
    report_id: str,
    message_type: str = Form(...),
    content: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user = Depends(get_current_user)
):
    user_id = current_user.id
    logger.info(f"New Discussion - Report: {report_id}, User: {user_id}, Type: {message_type}")

    # 1. Verify User and Role
    user_res = supabase.table("users").select("*").eq("id", user_id).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = user_res.data[0]
    user_role = user_data.get("role", "citizen").lower()
    user_name = user_data.get("full_name") or user_data.get("email")

    # 2. Validate Message Type for Role
    allowed_types = VALID_TYPES.get(user_role, [])
    if message_type not in allowed_types:
        raise HTTPException(
            status_code=403, 
            detail=f"Role '{user_role}' is not authorized to post message type '{message_type}'. Authorized types: {', '.join(allowed_types)}"
        )

    # 3. Handle Attachment
    photo_url = None
    if file:
        if message_type not in ["PROOF_UPLOAD", "CLARIFICATION", "FIELD_UPDATE"]:
             raise HTTPException(status_code=400, detail="Attachments only allowed for PROOF_UPLOAD, CLARIFICATION, or FIELD_UPDATE")
        
        file_bytes = await file.read()
        file_name = f"discussion_{report_id}_{datetime.utcnow().timestamp()}_{file.filename}"
        if upload_file(file_bytes, file_name):
            photo_url = get_public_url(file_name)

    # 4. Save to Database
    payload = {
        "report_id": report_id,
        "user_id": user_id,
        "message_type": message_type,
        "content": content,
        "photo_url": photo_url,
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        res = supabase.table("report_discussions").insert(payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to save discussion message")
        
        new_msg = res.data[0]
        new_msg["user_role"] = user_role
        new_msg["user_name"] = user_name
        
        # If status update or closure, update the report status as well
        if message_type == "STATUS_UPDATE" or message_type == "CLOSURE_NOTE":
             # We assume content or some other field might contain the new status, 
             # but for now we just log it. The dashboard already has /status endpoint.
             # However, making it cohesive is good.
             pass

        return new_msg
    except Exception as e:
        logger.error(f"Error adding discussion: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{report_id}/discussions", response_model=List[ReportDiscussion])
def get_discussions(report_id: str):
    """Retrieve all discussion messages for a report with user info."""
    try:
        # Join with users table to get role and name
        res = supabase.table("report_discussions")\
            .select("*, users(full_name, role, email)")\
            .eq("report_id", report_id)\
            .order("created_at", desc=False)\
            .execute()
        
        formatted_messages = []
        for msg in res.data:
            user_info = msg.get("users", {})
            msg["user_role"] = user_info.get("role", "citizen")
            msg["user_name"] = user_info.get("full_name") or user_info.get("email")
            # Remove the nested users object to match Pydantic model if needed, 
            # though Pydantic might handle it if defined correctly.
            formatted_messages.append(msg)
            
        return formatted_messages
    except Exception as e:
        logger.error(f"Error fetching discussions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
