from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, Form
from typing import List, Optional

from db.supabase import supabase
from db.models import Report, ReportCreate
from ml.infer import predict_image
from blockchain.write_hash import generate_hash, write_hash_to_chain, generate_location_hash
from utils.storage import upload_file, get_public_url
from utils.notify import notify_authorities
from fastapi.responses import JSONResponse
from fastapi import Depends
from utils.auth_utils import get_current_user
from fastapi.concurrency import run_in_threadpool
from utils.jurisdiction_utils import find_government_jurisdiction


router = APIRouter()

from datetime import datetime
import traceback
import sys

from middleware.logging import logger

def log_debug(msg):
    logger.debug(msg)

@router.post("/", response_model=Report)
async def create_report(
    background_tasks: BackgroundTasks,
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: str = Form(...),
    severity: int = Form(...),
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
) -> Report:
    """Create a new pollution report.
    
    UPDATED: synchronous processing for immediate demo feedback.
    """
    user_id = current_user.id
    # Robust role retrieval
    user_role = (getattr(current_user, 'user_metadata', {}) or {}).get("role")
    if not user_role:
        user_role = getattr(current_user, 'role', 'citizen')
    user_role = user_role.lower()
    
    if user_role != "citizen":
        logger.warning(f"🚫 ACCESS DENIED - User {user_id} with role {user_role} tried to report pollution.")
        raise HTTPException(
            status_code=403, 
            detail="Only Citizens can report pollution. Government and NGO accounts are for monitoring and action."
        )

    logger.info(f"🚀 SUBMISSION START - User: {user_id}")

    # 1. Read file
    file_bytes = await file.read()
    
    # 2. Key Generation
    timestamp = int(datetime.utcnow().timestamp())
    file_name = f"{user_id}_{timestamp}_{file.filename}"
    
    # 3. Get Public URL
    photo_url = await run_in_threadpool(get_public_url, file_name)

    # 4. Initialize payload
    report_id = str(generate_uuid())
    
    # 5. EXECUTE PIPELINE
    try:
        # --- REAL AI PIPELINE ---
        # A. AI Inference
        prediction = await run_in_threadpool(predict_image, file_bytes, description=description)
        ai_class = prediction.get("class", "unknown")
        ai_confidence = prediction.get("confidence", 0.0)
        
        # Status logic updated for universal 75% threshold and specific clean/invalid states
        if ai_class == "invalid_image":
            status = "Rejected by AI"
        elif ai_class == "clean":
            status = "Clean Water Detected"
        elif ai_confidence >= 0.75:
            status = "Verified by AI"
        else:
            status = "Submitted"

        # B. Upload File (Backgrounded for speed)
        background_tasks.add_task(upload_file, file_bytes, file_name)
        
        # C. Determine government jurisdiction based on location
        government_id = await run_in_threadpool(find_government_jurisdiction, latitude, longitude)
        if government_id:
            logger.info(f"Report assigned to government jurisdiction: {government_id}")
        else:
            logger.info("No government jurisdiction found for this location")
        
        # D. DB Insert (Split into reports and photos tables)
        new_report_payload = {
            "id": report_id,
            "user_id": user_id,
            "latitude": latitude,
            "longitude": longitude,
            "description": description,
            "severity": severity,
            "status": status,
            "ai_class": ai_class,
            "ai_confidence": ai_confidence,
            "government_id": government_id,
            "assigned_at": datetime.utcnow().isoformat() if government_id else None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert Report
        supabase.table("reports").insert(new_report_payload).execute()
        
        # Insert Photo
        photo_payload = {
            "report_id": report_id,
            "url": photo_url,
            "created_at": datetime.utcnow().isoformat()
        }
        supabase.table("photos").insert(photo_payload).execute()
        
        # Construct response object with photo_url included
        response_report = new_report_payload.copy()
        response_report["photo_url"] = photo_url
        
        # E. Blockchain & Notifications
        background_tasks.add_task(
            finalize_report_background,
            report_id,
            ai_class,
            status,
            description,
            user_id
        )

        return response_report

    except Exception as e:
        logger.error(f"Error in pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

import uuid
def generate_uuid():
    return uuid.uuid4()

async def finalize_report_background(report_id, ai_class, status, description, user_id):
    """Secondary tasks that don't need to block the UI response"""
    try:
        # Fetch full report data from DB for notification details
        res = supabase.table("reports").select("*").eq("id", report_id).execute()
        if res.data:
            report_data = res.data[0]
            
            # Trigger notifications to authorities (NGO/Gov)
            from utils.notify import notify_authorities
            notify_authorities(report_data)
            
            logger.info(f"Background finalized report {report_id} - Notifications triggered.")
        else:
            logger.warning(f"Report {report_id} not found in DB during background finalization.")
        
    except Exception as e:
        logger.error(f"Background finalization error: {e}")

# Helper to flatten photo_url from joined query
def create_report_objects(data: List[dict]) -> List[dict]:
    reports = []
    for item in data:
        # Handle if photos is a list or single object or None
        photos = item.get("photos", [])
        photo_url = None
        if isinstance(photos, list) and len(photos) > 0:
            photo_url = photos[0].get("url")
        elif isinstance(photos, dict):
            photo_url = photos.get("url")
            
        # Create a copy to avoid mutating original if needed, and assign photo_url
        report = item.copy()
        report["photo_url"] = photo_url
        
        # Clean up the photos field if not needed in the model (optional)
        if "photos" in report:
            del report["photos"]
            
        reports.append(report)
    return reports

@router.get("/", response_model=List[Report])
def get_reports() -> List[Report]:
    """Retrieve all reports."""
    # Select from reports and join photos to get the URL
    res = supabase.table("reports").select("*, photos(url)").order("created_at", desc=True).execute()
    return create_report_objects(res.data)

@router.get("/verified", response_model=List[Report])
def get_verified_reports() -> List[Report]:
    """
    Retrieve ONLY verified reports (for NGOs/Gov).
    """
    try:
        res = supabase.table("reports").select("*, photos(url)")\
            .filter("status", "in", "('Verified by AI', 'Verified')")\
            .order("severity", desc=True)\
            .order("created_at", desc=True)\
            .execute()
        return create_report_objects(res.data)
    except Exception as e:
        logger.error(f"Error fetching verified reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/government/my-jurisdiction", response_model=List[Report])
def get_government_jurisdiction_reports(current_user = Depends(get_current_user)) -> List[Report]:
    """
    Retrieve reports assigned to the current government user's jurisdiction.
    Only accessible by government role users.
    """
    user_id = current_user.id
    # Robust role retrieval
    user_role = (getattr(current_user, 'user_metadata', {}) or {}).get("role")
    if not user_role:
        user_role = getattr(current_user, 'role', 'citizen')
    user_role = user_role.lower()
    
    if user_role != "government":
        raise HTTPException(
            status_code=403, 
            detail="Access denied. This endpoint is only for government users."
        )
    
    try:
        # Get jurisdiction for this government user
        jurisdiction_res = supabase.table("government_jurisdictions")\
            .select("id, government_code, city_name")\
            .eq("government_user_id", user_id)\
            .execute()
        
        if not jurisdiction_res.data:
            logger.warning(f"No jurisdiction found for government user {user_id}")
            return []
        
        jurisdiction = jurisdiction_res.data[0]
        jurisdiction_id = jurisdiction["id"]
        
        logger.info(f"Fetching reports for {jurisdiction['city_name']} ({jurisdiction['government_code']})")
        
        # Get reports assigned to this jurisdiction
        reports_res = supabase.table("reports")\
            .select("*, photos(url)")\
            .eq("government_id", jurisdiction_id)\
            .order("created_at", desc=True)\
            .execute()
        
        logger.info(f"Found {len(reports_res.data)} reports for jurisdiction {jurisdiction['city_name']}")
        return create_report_objects(reports_res.data)
        
    except Exception as e:
        logger.error(f"Error fetching government jurisdiction reports: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}", response_model=List[Report])
def get_user_reports(user_id: str):
    """Retrieve all reports submitted by a specific user."""
    logger.info(f"Entering get_user_reports for user {user_id}")
    try:
        res = supabase.table("reports").select("*, photos(url)").eq("user_id", user_id).order("created_at", desc=True).execute()
        logger.info(f"Found {len(res.data) if res.data else 0} reports for user {user_id}")
        return create_report_objects(res.data)
    except Exception as e:
        logger.error(f"ERROR in get_user_reports: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/count/{user_id}")
def get_user_report_count(user_id: str):
    """Get the total number of reports submitted by a specific user."""
    try:
        res = supabase.table("reports").select("id", count="exact").eq("user_id", user_id).execute()
        return {"count": res.count if res.count else 0}
    except Exception as e:
        logger.error(f"Error fetching report count for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/map-data")
def get_heatmap_data():
    """Fetch lightweight coordinate and severity data for the heatmap."""
    try:
        # Fetch only verified or submitted reports for the map
        res = supabase.table("reports").select("id, latitude, longitude, severity, ai_class").filter("status", "in", "('Verified by AI', 'Submitted', 'Action completed')").execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching heatmap data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{report_id}", response_model=Report)
def get_report(report_id: str) -> Report:
    """Retrieve a single report by its ID."""
    res = supabase.table("reports").select("*, photos(url)").eq("id", report_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Report not found")
    
    reports = create_report_objects(res.data)
    return reports[0]

@router.put("/{report_id}/status")
async def update_report_status(
    report_id: str, 
    status: str = Form(...), 
    action_note: str = Form(None),
    verification_image: Optional[UploadFile] = File(None), # Prompt 2 & 6: Proof required
    current_user = Depends(get_current_user)
) -> dict:
    """Update report status with accountability rules.
    - Supports proof image upload.
    """
    actor_id = current_user.id
    # Robust role retrieval
    user_role = (getattr(current_user, 'user_metadata', {}) or {}).get("role")
    if not user_role:
        user_role = getattr(current_user, 'role', 'citizen')
    user_role = user_role.lower()
    
    logger.info(f"Status Update Request - Report: {report_id}, Status: {status}, Image: {bool(verification_image)}")
    
    # 1. Fetch current state
    res = supabase.table("reports").select("*").eq("id", report_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report = res.data[0]
    
    # Check for existing proof if trying to resolve
    existing_proof_res = supabase.table("photos").select("url").eq("report_id", report_id).execute()
    # We assume first photo is original. Any subsequent photo might be proof.
    # Or we explicitly check if a new image is being uploaded now.
    has_uploaded_proof = bool(verification_image) or (len(existing_proof_res.data) > 1)

    # 2. PROMPT 6: No closure without proof
    if status in ["Action completed", "Resolved", "Awaiting Verification"]:
        if not has_uploaded_proof:
             raise HTTPException(
                status_code=400, 
                detail="ACCOUNTABILITY LOCK: Closure or verification requires proof-of-work. Please upload a cleanup photo."
            )

    # 3. PROMPT 4, 5: NGO Confirmation
    if status == "Resolved" and user_role != "ngo":
        raise HTTPException(
            status_code=403, 
            detail="VALIDATION REQUIRED: Only NGOs can provide final verification for completed cleanups."
        )

    # 4. Handle Image Upload if provided
    new_photo_url = None
    if verification_image:
        file_bytes = await verification_image.read()
        file_name = f"proof_{report_id}_{verification_image.filename}"
        if upload_file(file_bytes, file_name):
            new_photo_url = get_public_url(file_name)
            # Insert into photos table
            supabase.table("photos").insert({
                "report_id": report_id,
                "url": new_photo_url,
                "label": "Cleanup Proof"
            }).execute()

    # 5. Perform Report Update
    update_payload = {
        "status": status,
        "updated_at": datetime.utcnow().isoformat()
    }
    if action_note:
        update_payload["action_note"] = action_note
        
    try:
        final_res = supabase.table("reports").update(update_payload).eq("id", report_id).execute()
        updated_report = final_res.data[0]
        
        # 6. Audit Trail
        audit_entry = {
            "report_id": report_id,
            "user_id": actor_id,
            "message_type": "STATUS_UPDATE",
            "content": f"STATUS CHANGED TO: {status}. Photo: {'Uploaded' if new_photo_url else 'None'}. Note: {action_note or 'N/A'}",
            "created_at": datetime.utcnow().isoformat()
        }
        supabase.table("report_discussions").insert(audit_entry).execute()
        
        return updated_report
    except Exception as e:
        logger.error(f"Error updating report status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{report_id}/verify")
def verify_report(report_id: str) -> List[dict]:
    """Mark a report as verified (admin/NGO action)."""
    # Legacy: Still functional but maps to new flow
    return update_report_status(report_id, status="Verified by AI")
