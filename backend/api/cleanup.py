from db.supabase import supabase
from utils.storage import upload_file, get_public_url
from fastapi import Depends
from utils.auth_utils import get_current_user

router = APIRouter()

@router.post("/{report_id}/start")
def start_cleanup(
    report_id: str, 
    organization: str = Form(None),
    current_user = Depends(get_current_user)
):
    actor_id = current_user.id
    """Initialize a cleanup action for a verified report."""
    res = supabase.table("cleanup_actions").upsert({
        "report_id": report_id,
        "actor_id": actor_id,
        "organization": organization,
        "status": "in_progress",
        "progress": 0
    }).execute()
    return res.data

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

@router.get("/active")
def get_active_cleanups():
    """Get all active cleanup activities for the public board."""
    # Join with reports to get location/type
    res = supabase.table("cleanup_actions").select("*, reports(*)").neq("status", "archived").execute()
    return res.data
