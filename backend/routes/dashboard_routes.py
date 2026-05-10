from fastapi import APIRouter, Depends, HTTPException
from auth.role_dependency import require_role
from db.mongodb import db
from bson import ObjectId

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])