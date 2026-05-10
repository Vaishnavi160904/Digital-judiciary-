from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from datetime import datetime

from db.mongodb import get_database
from auth.auth_utils import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    verify_token
)

router = APIRouter(prefix="/auth", tags=["authentication"])


class RegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str
    role: str = "lawyer"  # lawyer, judge, court_staff, admin
    assignedCourt: Optional[str] = None  # Required when role is court_staff


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    fullName: str
    email: str
    role: str
    assignedCourt: Optional[str] = None


@router.post("/register")
async def register(
    register_data: RegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Register a new user"""
    try:
        users_collection = db["users"]
        
        # Court staff must provide assigned court/location
        if register_data.role == "court_staff":
            if not register_data.assignedCourt or not register_data.assignedCourt.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Court staff must select their assigned court/location"
                )
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": register_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = get_password_hash(register_data.password)
        
        # Create user document
        user_doc = {
            "fullName": register_data.fullName,
            "email": register_data.email,
            "password": hashed_password,
            "role": register_data.role,
            "createdAt": datetime.utcnow()
        }
        if register_data.role == "court_staff" and register_data.assignedCourt:
            user_doc["assignedCourt"] = register_data.assignedCourt.strip()
        
        # Insert user
        result = await users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Token payload: include assignedCourt for court_staff
        token_data = {
            "user_id": user_id,
            "email": register_data.email,
            "role": register_data.role
        }
        if register_data.role == "court_staff" and register_data.assignedCourt:
            token_data["assignedCourt"] = register_data.assignedCourt.strip()
        
        access_token = create_access_token(data=token_data)
        
        user_response = {
            "id": user_id,
            "fullName": register_data.fullName,
            "email": register_data.email,
            "role": register_data.role
        }
        if register_data.role == "court_staff" and register_data.assignedCourt:
            user_response["assignedCourt"] = register_data.assignedCourt.strip()
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "message": "User registered successfully",
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_response
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login")
async def login(
    login_data: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Login user"""
    try:
        users_collection = db["users"]
        
        # Find user by email
        user = await users_collection.find_one({"email": login_data.email})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(login_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user_id = str(user["_id"])
        
        token_data = {
            "user_id": user_id,
            "email": user["email"],
            "role": user["role"]
        }
        if user.get("role") == "court_staff" and user.get("assignedCourt"):
            token_data["assignedCourt"] = user["assignedCourt"]
        
        access_token = create_access_token(data=token_data)
        
        login_user = {
            "id": user_id,
            "fullName": user["fullName"],
            "email": user["email"],
            "role": user["role"]
        }
        if user.get("role") == "court_staff" and user.get("assignedCourt"):
            login_user["assignedCourt"] = user["assignedCourt"]
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Login successful",
                "access_token": access_token,
                "token_type": "bearer",
                "user": login_user
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/me")
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current user info"""
    try:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        # Verify token
        user_data = await verify_token(authorization)
        
        users_collection = db["users"]
        user = await users_collection.find_one({"email": user_data["email"]})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        me = {
            "id": str(user["_id"]),
            "fullName": user["fullName"],
            "email": user["email"],
            "role": user["role"]
        }
        if user.get("role") == "court_staff" and user.get("assignedCourt"):
            me["assignedCourt"] = user["assignedCourt"]
        return me
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user info: {str(e)}"
        )