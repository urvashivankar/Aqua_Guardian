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

    OPTIMIZED: This endpoint now returns immediately.
    Heavier tasks (AI inference, storage upload, blockchain) are handled in the background.
    """
    user_id = current_user.id
    logger.info(f"🚀 RAPID SUBMISSION - User: {user_id}, Desc: {description[:50]}...")

    # 1. Read file into memory immediately (necessary before the request closes)
    file_bytes = await file.read()
    
    # 2. Determine filename and photo_url
    timestamp = int(datetime.utcnow().timestamp())
    file_name = f"{user_id}_{timestamp}_{file.filename}"
    photo_url = get_public_url(file_name)

    # 3. Build the INITIAL report payload
    # Status is set to "AI Analysis in Progress" for rapid feedback
    report_payload = {
        "user_id": user_id,
        "latitude": latitude,
        "longitude": longitude,
        "description": description,
        "severity": severity,
        "status": "AI Analysis in Progress",
        "updated_at": datetime.utcnow().isoformat()
    }

    # 4. Insert the report into Supabase (Need the ID for the response)
    try:
        res = supabase.table("reports").insert(report_payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Initial database insert failed")
        
        new_report = res.data[0]
        # Attach photo_url for immediate UI placeholder logic if needed
        new_report["photo_url"] = photo_url
            
        # 5. TRIGGER BACKGROUND PIPELINE
        # We pass everything needed to the background task so we can return NOW.
        background_tasks.add_task(
            process_report_pipeline, 
            new_report["id"], 
            file_bytes, 
            file_name, 
            photo_url,
            description
        )

        return new_report
    except Exception as e:
        logger.error(f"❌ Error creating rapid report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

async def process_report_pipeline(
    report_id: str, 
    file_bytes: bytes, 
    file_name: str, 
    photo_url: str,
    description: str
):
    """
    HEAVY LIFTING PIPELINE:
    - AI Inference
    - Storage Upload
    - Blockchain Registration
    - Notifications
    """
    try:
        logger.info(f"🛠️ Background Pipeline Started for Report: {report_id}")
        
        # 1. AI Inference
        try:
            prediction = await run_in_threadpool(predict_image, file_bytes, description=description)
            ai_class = prediction.get("class", "unknown")
            ai_confidence = prediction.get("confidence", 0.0)
            
            # Auto-verify if confidence is 70% or higher (User requirement)
            status = "Verified by AI" if ai_confidence >= 0.70 else "Submitted"
            
            if ai_class == "invalid_image":
                status = "Rejected by AI"
                logger.warning(f"⚠️ AI REJECTED report {report_id}: {prediction.get('reason')}")

        except Exception as ml_e:
            logger.error(f"ML Inference failed in background: {ml_e}")
            ai_class = "unknown"
            ai_confidence = 0.0
            status = "Submitted"

        # 2. Upload file & Link to report
        try:
            if upload_file(file_bytes, file_name):
                supabase.table("photos").insert({"report_id": report_id, "url": photo_url}).execute()
        except Exception as storage_e:
            logger.error(f"Storage upload failed in background: {storage_e}")

        # 3. Update report with AI results
        update_payload = {
            "ai_class": ai_class,
            "ai_confidence": ai_confidence,
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        supabase.table("reports").update(update_payload).eq("id", report_id).execute()

        # 4. Log to Blockchain
        try:
            # Reconstruct minimal data for hashing
            report_for_hash = {"id": report_id, "status": status, "ai_class": ai_class}
            from blockchain.write_hash import generate_hash, write_hash_to_chain
            report_hash = generate_hash(report_for_hash)
            
            tx_hash = write_hash_to_chain(report_hash, report_id, ai_class, status, "hash_placeholder")
            
            if tx_hash and tx_hash.startswith("0x"):
                supabase.table("blockchain_logs").insert({"report_id": report_id, "tx_hash": tx_hash}).execute()
        except Exception as bc_e:
            logger.error(f"Blockchain logging failed in background: {bc_e}")

        # 5. Notify Authorities if confidence is 70% or higher
        if ai_confidence >= 0.70 and status != "Rejected by AI":
            from utils.notify import notify_authorities
            # Provide full context to notifications
            notify_authorities({
                "id": report_id, 
                "description": description, 
                "ai_class": ai_class,
                "ai_confidence": ai_confidence,
                "status": status
            })

        # 6. Mint NFT Reward if verified and user has wallet
        if status == "Verified by AI":
            try:
                # Fetch user's wallet address
                report_res = supabase.table("reports").select("user_id").eq("id", report_id).execute()
                if report_res.data:
                    u_id = report_res.data[0]["user_id"]
                    user_res = supabase.table("users").select("wallet_address").eq("id", u_id).execute()
                    
                    if user_res.data and user_res.data[0].get("wallet_address"):
                        wallet = user_res.data[0]["wallet_address"]
                        from blockchain.contract_interface import mint_contribution_proof
                        
                        # Generate metadata URI (Mocking a placeholder for now)
                        metadata_uri = f"https://api.aquaguardian.org/metadata/report/{report_id}"
                        
                        token_id, nft_tx = mint_contribution_proof(wallet, metadata_uri)
                        
                        if nft_tx:
                            supabase.table("reports").update({
                                "nft_token_id": token_id,
                                "nft_tx_hash": nft_tx
                            }).eq("id", report_id).execute()
                            logger.info(f"🏆 NFT Minted for report {report_id}: Token {token_id}")
                            
                            # 7. Send Push Notification to User
                            try:
                                from api.notifications import send_push_notification
                                send_push_notification(
                                    user_id=u_id,
                                    title="Report Verified! 🌊",
                                    message=f"Your report in {description[:20]}... has been verified. Impact NFT minted!",
                                    url=f"/profile"
                                )
                            except Exception as push_err:
                                logger.error(f"Push notification failed: {push_err}")

            except Exception as nft_e:
                logger.error(f"NFT Minting failed in background: {nft_e}")

        logger.info(f"✅ Background Pipeline Successful for Report: {report_id}")
        
    except Exception as e:
        logger.error(f"CRITICAL failure in background pipeline for {report_id}: {e}", exc_info=True)

@router.get("/", response_model=List[Report])
def get_reports() -> List[Report]:
    """Retrieve all reports."""
    res = supabase.table("reports").select("*").execute()
    return res.data

@router.get("/user/{user_id}", response_model=List[Report])
def get_user_reports(user_id: str):
    """Retrieve all reports submitted by a specific user."""
    logger.info(f"Entering get_user_reports for user {user_id}")
    try:
        res = supabase.table("reports").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        logger.info(f"Found {len(res.data) if res.data else 0} reports for user {user_id}")
        return res.data
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
    res = supabase.table("reports").select("*").eq("id", report_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return res.data[0]

@router.post("/{report_id}/status")
def update_report_status(report_id: str, status: str = Form(...), action_note: str = Form(None)) -> dict:
    """Update the status of a report and add an optional action note."""
    logger.info(f"Status Update - Report: {report_id}, Status: {status}")
    
    update_payload = {
        "status": status,
        "updated_at": datetime.utcnow().isoformat()
    }
    if action_note:
        update_payload["action_note"] = action_note
        
    try:
        res = supabase.table("reports").update(update_payload).eq("id", report_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Report not found")
            
        updated_report = res.data[0]
        
        # Trigger notification
        message = f"Your report status has been updated to: {status}"
        if action_note:
            message += f". Note: {action_note}"
            
        from utils.notify import send_notification
        send_notification(updated_report["user_id"], message)
        
        return updated_report
    except Exception as e:
        logger.error(f"Error updating report status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{report_id}/verify")
def verify_report(report_id: str) -> List[dict]:
    """Mark a report as verified (admin/NGO action)."""
    # Legacy: Still functional but maps to new flow
    return update_report_status(report_id, status="Verified by AI")
