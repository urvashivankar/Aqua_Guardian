from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db.supabase import supabase
from middleware.logging import logger

security = HTTPBearer()

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to verify the Supabase JWT and return the user object.
    Usage: user = Depends(get_current_user)
    """
    try:
        # Verify the token with Supabase
        res = supabase.auth.get_user(token.credentials)
        
        if not res.user:
            logger.warning("Invalid or expired token provided")
            raise HTTPException(status_code=401, detail="Invalid or expired session")
            
        return res.user
        
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
