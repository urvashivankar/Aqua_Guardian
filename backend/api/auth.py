from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.supabase import supabase
from middleware.logging import logger

router = APIRouter()

class UserCredentials(BaseModel):
    email: str
    password: str
    name: str = None
    role: str = "citizen"  # Default role

@router.post("/register")
def register(user: UserCredentials):
    import re
    import traceback
    
    logger.info(f"🔵 REGISTRATION START - Email: {user.email}")
    logger.info(f"🎭 ROLE RECEIVED: '{user.role}' (type: {type(user.role).__name__})")
    
    # Validate email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, user.email):
        logger.warning(f"Invalid email format: {user.email}")
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Validate password strength
    if len(user.password) < 6:
        logger.warning(f"Password too short for: {user.email}")
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    # Validate Role (case-insensitive)
    valid_roles = ["citizen", "ngo", "government", "student", "other"]
    role_lower = user.role.lower()
    logger.info(f"🔍 Role validation - Input: '{user.role}' -> Lowercase: '{role_lower}'")
    
    if role_lower not in valid_roles:
        logger.warning(f"Invalid role attempted: {user.role}")
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of {valid_roles}")

    try:
        # Supabase Auth Sign Up
        logger.info(f"📤 Sending to Supabase - Role: '{role_lower}'")
        res = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "name": user.name,
                    "role": role_lower  # Store lowercase for consistency
                }
            }
        })
        
        if not res.user:
            logger.error(f"No user data returned from Supabase for: {user.email}")
            raise HTTPException(status_code=500, detail="Registration failed - no user data returned")
        
        logger.info(f"✅ Supabase user created - ID: {res.user.id}")
        
        # Create public profile entry (UPSERT to handle existing users)
        try:
            profile_data = {
                "id": res.user.id,
                "email": res.user.email,
                "full_name": user.name,
                "role": role_lower  # CRITICAL: Store lowercase role
            }
            logger.info(f"💾 Upserting profile - Role: '{role_lower}'")
            
            # UPSERT: Insert or update if exists
            supabase.table("users").upsert(profile_data, on_conflict="id").execute()
            logger.info(f"✅ Profile upserted for: {user.email} with role: {role_lower}")
            
        except Exception as profile_err:
            logger.error(f"❌ Profile upsert failed for {user.email}: {profile_err}")
            # Don't fail registration, just log the error
        
        logger.info(f"Registration successful for: {user.email}")
        logger.info(f"   User ID: {res.user.id}")
        logger.info(f"   Email confirmed: {res.user.email_confirmed_at is not None}")
        
        # Return formatted response
        return {
            "success": True,
            "message": "Registration successful. Please check your email to confirm your account." if not res.user.email_confirmed_at else "Registration successful!",
            "user": {
                "id": res.user.id,
                "email": res.user.email,
                "name": user.name,
                "email_confirmed": res.user.email_confirmed_at is not None
            },
            "session": {
                "access_token": res.session.access_token if res.session else None,
                "refresh_token": res.session.refresh_token if res.session else None,
                "expires_at": res.session.expires_at if res.session else None
            } if res.session else None,
            "requires_email_confirmation": res.user.email_confirmed_at is None
        }
    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e).lower()
        
        # Handle specific error cases
        if "user already registered" in error_str or "already exists" in error_str or "duplicate" in error_str:
            logger.warning(f"Duplicate email attempt: {user.email}")
            raise HTTPException(status_code=400, detail=f"A user with email {user.email} already exists. Please login instead.")
        elif "invalid" in error_str and "email" in error_str:
            logger.warning(f"Invalid email rejected by Supabase: {user.email}")
            raise HTTPException(status_code=400, detail="Invalid email address")
        elif "weak password" in error_str or "password" in error_str:
            logger.warning(f"Weak password for: {user.email}")
            raise HTTPException(status_code=400, detail="Password does not meet security requirements")
        else:
            logger.error(f"Registration failed for {user.email}", exc_info=True)
            
            raise HTTPException(
                status_code=500, 
                detail=f"Registration failed: {str(e)}"
            )

@router.post("/login")
def login(user: UserCredentials):
    import traceback
    
    logger.info(f"Received login request for: {user.email}")
    try:
        logger.info(f"Attempting Supabase login for: {user.email}")
        res = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        if not res.user:
            logger.error(f"No user data returned from Supabase for: {user.email}")
            raise HTTPException(status_code=401, detail="Login failed - no user data returned")
        
        logger.info(f"Login successful for: {user.email}")
        logger.info(f"   User ID: {res.user.id}")
        
        # Return formatted response
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": res.user.id,
                "email": res.user.email,
                "name": res.user.user_metadata.get("name", res.user.email.split("@")[0]) if res.user.user_metadata else res.user.email.split("@")[0],
                "email_confirmed": res.user.email_confirmed_at is not None
            },
            "session": {
                "access_token": res.session.access_token if res.session else None,
                "refresh_token": res.session.refresh_token if res.session else None,
                "expires_at": res.session.expires_at if res.session else None
            } if res.session else None
        }
    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e).lower()
        
        # Handle specific error cases
        if "invalid" in error_str and ("credentials" in error_str or "password" in error_str or "email" in error_str):
            logger.warning(f"Invalid credentials for: {user.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        elif "not found" in error_str or "user not found" in error_str:
            logger.warning(f"User not found: {user.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        elif "email not confirmed" in error_str:
            logger.warning(f"Email not confirmed: {user.email}")
            raise HTTPException(status_code=401, detail="Please verify your email before logging in")
        else:
            logger.error(f"Login failed for {user.email}", exc_info=True)
            
            raise HTTPException(
                status_code=500,
                detail=f"Login failed: {str(e)}"
            )
