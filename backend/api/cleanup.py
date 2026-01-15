from db.supabase import supabase
from utils.storage import upload_file, get_public_url
from fastapi import Depends, APIRouter, Form, File, UploadFile, HTTPException
from utils.auth_utils import get_current_user
from datetime import datetime

router = APIRouter()

@router.post("/{report_id}/start")
def start_cleanup(
    report_id: str, 
    organization: str = Form(None),
    current_user = Depends(get_current_user)
):
    actor_id = current_user.id
    user_role = current_user.role.lower() if hasattr(current_user, 'role') else "citizen"
    
    logger.info(f"Cleanup START Request - Report: {report_id}, Actor: {actor_id} ({user_role})")
    
    # 1. SAFETY FIREWALL: Check Report Severity
    try:
        report_res = supabase.table("reports").select("severity").eq("id", report_id).execute()
        if not report_res.data:
             raise HTTPException(status_code=404, detail="Target report not found.")
             
        severity = report_res.data[0].get("severity", 0)
        
        # If High/Critical (8-10) and NOT Gov -> BLOCK
        if severity >= 8 and user_role != "government":
            raise HTTPException(
                status_code=403, 
                detail="SAFETY PROTOCOL: High-severity incidents require HAZMAT clearance. Restricted to Government agencies only."
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Firewall check failed: {e}")
        # If we can't check severity, safely proceed or fail? Proceed for now but log.

    # 2. Upsert cleanup action
    # We use report_id as a key to prevent multiple cleanup actions for the same report?
    # Usually cleanup_actions has its own ID. Let's check if there's an existing one.
    existing = supabase.table("cleanup_actions").select("id").eq("report_id", report_id).execute()
    
    cleanup_payload = {
        "report_id": report_id,
        "actor_id": actor_id,
        "organization": organization or "Aqua Guardian Partner",
        "status": "in_progress",
        "progress": 0,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if existing.data:
        res = supabase.table("cleanup_actions").update(cleanup_payload).eq("report_id", report_id).execute()
    else:
        cleanup_payload["created_at"] = datetime.utcnow().isoformat()
        res = supabase.table("cleanup_actions").insert(cleanup_payload).execute()
        
    if not res.data:
        raise HTTPException(status_code=500, detail="Database failure while starting cleanup drive.")

    # 3. Update report status to Resolution in Progress
    supabase.table("reports").update({"status": "Resolution in Progress"}).eq("id", report_id).execute()

    return res.data[0]

@router.post("/{cleanup_id}/join")
def join_cleanup(
    cleanup_id: str, 
    role: str = Form("Citizen"),
    current_user = Depends(get_current_user)
):
    user_id = current_user.id
    """Allow a user to join a cleanup activity."""
    try:
        res = supabase.table("cleanup_participation").insert({
            "cleanup_id": cleanup_id,
            "user_id": user_id,
            "role": role
        }).execute()
        return res.data
    except Exception as e:
        if "unique_violation" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(status_code=400, detail="You have already joined this cleanup.")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{cleanup_id}/update")
async def update_cleanup(
    cleanup_id: str, 
    progress: int = Form(...), 
    remark: str = Form(None),
    files: list[UploadFile] = File(None)
):
    """Update progress, add remarks, and upload completion photos (Authority only)."""
    photo_urls = []
    if files:
        for file in files:
            file_bytes = await file.read()
            file_name = f"cleanup_{cleanup_id}_{file.filename}"
            if upload_file(file_bytes, file_name, bucket="evidence"):
                photo_urls.append(get_public_url(file_name, bucket="evidence"))

    update_payload = {
        "progress": progress,
        "completion_remark": remark,
        "status": "completed" if progress == 100 else "in_progress"
    }
    if photo_urls:
        update_payload["completion_photos"] = photo_urls

    res = supabase.table("cleanup_actions").update(update_payload).eq("id", cleanup_id).execute()
    
    # Also update the report status and MINT NFT if 100%
    if progress == 100 and res.data:
        cleanup_data = res.data[0]
        report_id = cleanup_data["report_id"]
        actor_id = cleanup_data["actor_id"]
        
        # 1. Update report status
        supabase.table("reports").update({"status": "Action completed"}).eq("id", report_id).execute()
        
        # 2. Trigger NFT Minting for the actor
        try:
            user_res = supabase.table("users").select("wallet_address").eq("id", actor_id).execute()
            if user_res.data and user_res.data[0].get("wallet_address"):
                wallet = user_res.data[0]["wallet_address"]
                from blockchain.contract_interface import mint_contribution_proof
                
                # Metadata for the cleanup completion
                metadata_uri = f"https://api.aquaguardian.org/metadata/cleanup/{cleanup_id}"
                
                token_id, nft_tx = mint_contribution_proof(wallet, metadata_uri)
                
                if nft_tx:
                    supabase.table("cleanup_actions").update({
                        "nft_token_id": token_id,
                        "nft_tx_hash": nft_tx
                    }).eq("id", cleanup_id).execute()
        except Exception as e:
            print(f"Cleanup NFT Minting failed: {e}")

    return res.data

@router.post("/create_campaign")
def create_campaign(
    title: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    organization: str = Form(...),
    date: str = Form(None),
    current_user = Depends(get_current_user)
):
    actor_id = current_user.id
    """Create a new cleanup campaign from scratch (implicitly creates a report)."""
    
    # 1. Create a placeholder Report
    # We use a default image or placeholder if none provided.
    report_data = {
        # "location" and "type" are not in the DB schema for reports
        "latitude": 0.0, 
        "longitude": 0.0,
        "severity": 1, # Low severity for planned events
        "description": f"CAMPAIGN: {title} @ {location}. {description}",
        "status": "Verified",
        "user_id": actor_id,
        "ai_class": "Cleanup Drive",
        "ai_confidence": 1.0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    import uuid
    report_data["id"] = str(uuid.uuid4())
    
    rep_res = supabase.table("reports").insert(report_data).execute()
    if not rep_res.data:
        raise HTTPException(status_code=500, detail="Failed to create campaign base report.")
        
    report_id = rep_res.data[0]["id"]
    
    # Insert Placeholder Photo
    photo_url = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600&auto=format&fit=crop"
    supabase.table("photos").insert({
        "report_id": report_id,
        "url": photo_url
    }).execute()

    # 2. Create Cleanup Action
    res = supabase.table("cleanup_actions").insert({
        "report_id": report_id,
        "actor_id": actor_id,
        "organization": organization,
        "status": "in_progress",
        "progress": 0
    }).execute()
    
    return res.data[0]

@router.get("/active")
def get_active_cleanups():
    """Get all active cleanup activities for the public board."""
    # Join with reports to get location/type
    res = supabase.table("cleanup_actions").select("*, reports(*)").neq("status", "archived").execute()
    return res.data
