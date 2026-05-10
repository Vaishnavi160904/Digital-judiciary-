from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
from pathlib import Path
import uuid

from db.mongodb import get_database
from models.case_model import (
    CaseUpdateRequest, 
    CaseStatsResponse
)
from services.case_service import CaseService
from services.lawgpt_service import LawGPTService
from auth.auth_utils import verify_token

router = APIRouter(prefix="/cases", tags=["cases"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/cases")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_case_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> CaseService:
    return CaseService(db)


@router.get("/all")
async def get_all_cases(
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Get all cases. Judges and admin see all; court_staff see only cases for their assigned court.
    """
    try:
        role = current_user.get("role")
        if role not in ["judge", "court_staff", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied - insufficient permissions"
            )
        
        cases = await case_service.get_all_cases()
        
        # Court staff only see cases for their assigned court/location
        if role == "court_staff":
            assigned = (current_user.get("assignedCourt") or "").strip()
            if assigned:
                cases = [c for c in cases if (c.get("court") or "").strip() == assigned]
            else:
                # Legacy staff without assignedCourt see no cases until admin assigns court
                cases = []
        
        return cases
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching all cases: {str(e)}"
        )



@router.post("/submit")
async def submit_case(
    userId: str = Form(...),
    fullName: str = Form(...),
    email: str = Form(...),
    phoneNumber: str = Form(...),
    address: str = Form(...),
    caseTitle: str = Form(...),
    caseDescription: str = Form(...),
    caseType: str = Form(...),
    caseDate: str = Form(...),
    urgencyLevel: str = Form("Normal"),
    court: str = Form(...),
    district: str = Form(...),
    state: str = Form(...),
    policeStation: Optional[str] = Form(None),
    firNumber: Optional[str] = Form(None),
    opposingPartyName: Optional[str] = Form(None),
    opposingPartyAddress: Optional[str] = Form(None),
    lawyerName: Optional[str] = Form(None),
    evidenceDescription: Optional[str] = Form(None),
    witnessDetails: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Submit a new case with AI analysis and file uploads
    """
    try:
        # Initialize LawGPT service
        lawgpt_service = LawGPTService()
        
        # Get AI analysis
        analysis = await lawgpt_service.analyze_case(
            case_title=caseTitle,
            case_description=caseDescription,
            case_type=caseType
        )
        
        # Handle file uploads
        uploaded_filenames = []
        if files:
            for file in files:
                if file.filename:
                    # Generate unique filename
                    file_extension = os.path.splitext(file.filename)[1]
                    unique_filename = f"{uuid.uuid4()}{file_extension}"
                    file_path = UPLOAD_DIR / unique_filename
                    
                    # Save file
                    contents = await file.read()
                    with open(file_path, "wb") as f:
                        f.write(contents)
                    
                    uploaded_filenames.append(unique_filename)
        
        # Record who is submitting (logged-in user = lawyer)
        submitted_by_name = (current_user.get("fullName") or "").strip() or None

        # Prepare case data
        case_data = {
            "userId": userId,
            "fullName": fullName,
            "email": email,
            "phoneNumber": phoneNumber,
            "address": address,
            "caseTitle": caseTitle,
            "caseDescription": caseDescription,
            "caseType": caseType,
            "caseDate": caseDate,
            "urgencyLevel": urgencyLevel,
            "court": court,
            "district": district,
            "state": state,
            "policeStation": policeStation,
            "firNumber": firNumber,
            "opposingPartyName": opposingPartyName,
            "opposingPartyAddress": opposingPartyAddress,
            "lawyerName": lawyerName,
            "submittedByName": submitted_by_name,
            "evidenceDescription": evidenceDescription,
            "witnessDetails": witnessDetails,
            "uploadedFiles": uploaded_filenames,
            "classification": analysis["classification"],
            "suggestions": analysis["suggestions"],
            "summary": analysis["summary"]
        }
        
        # Create case in database
        created_case = await case_service.create_case(case_data)
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "message": "Case submitted successfully",
                "caseId": created_case.get("caseId"),
                "classification": analysis["classification"],
                "suggestions": analysis["suggestions"],
                "summary": analysis["summary"],
                "filesUploaded": len(uploaded_filenames)
            }
        )
    
    except Exception as e:
        # Clean up uploaded files if case creation fails
        if uploaded_filenames:
            for filename in uploaded_filenames:
                file_path = UPLOAD_DIR / filename
                if file_path.exists():
                    file_path.unlink()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting case: {str(e)}"
        )


@router.get("/user/{user_id}")
async def get_user_cases(
    user_id: str,
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Get all cases for a specific user
    """
    try:
        # Verify user can only access their own cases
        if current_user.get("user_id") != user_id and current_user.get("role") not in ["admin", "judge"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        cases = await case_service.get_cases_by_user(user_id)
        return cases
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching cases: {str(e)}"
        )


@router.get("/recent/{user_id}")
async def get_recent_cases(
    user_id: str,
    limit: int = 5,
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Get recent cases for a user
    """
    try:
        # Verify user can only access their own cases
        if current_user.get("user_id") != user_id and current_user.get("role") not in ["admin", "judge"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        cases = await case_service.get_recent_cases(user_id, limit)
        return cases
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent cases: {str(e)}"
        )


@router.get("/stats/{user_id}")
async def get_user_case_stats(
    user_id: str,
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Get case statistics for a user
    """
    try:
        # Verify user can only access their own stats
        if current_user.get("user_id") != user_id and current_user.get("role") not in ["admin", "judge"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        stats = await case_service.get_user_stats(user_id)
        return stats
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stats: {str(e)}"
        )


@router.get("/file/{case_id}/{filename:path}")
async def download_case_file(
    case_id: str,
    filename: str,
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Download a file attached to a case. User must own the case or be judge/admin.
    """
    try:
        case = await case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        if case["userId"] != current_user.get("user_id") and current_user.get("role") not in ["admin", "judge"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        uploaded = case.get("uploadedFiles") or []
        if filename not in uploaded:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found for this case")
        file_path = UPLOAD_DIR / filename
        if not file_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")
        return FileResponse(path=file_path, filename=filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{case_id}")
async def get_case_details(
    case_id: str,
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Get details of a specific case
    """
    try:
        case = await case_service.get_case_by_id(case_id)
        
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )
        
        # Verify user can access this case
        if case["userId"] != current_user.get("user_id") and current_user.get("role") not in ["admin", "judge"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return case
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching case details: {str(e)}"
        )


@router.put("/{case_id}")
async def update_case(
    case_id: str,
    update_request: CaseUpdateRequest,
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Update a case (status, classification, etc.)
    """
    try:
        # Get existing case
        case = await case_service.get_case_by_id(case_id)
        
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )
        
        # Verify permissions: owner, judge, admin, or court_staff for their assigned court
        role = current_user.get("role")
        if case["userId"] == current_user.get("user_id"):
            pass  # owner can update
        elif role == "admin" or role == "judge":
            pass
        elif role == "court_staff":
            assigned = (current_user.get("assignedCourt") or "").strip()
            case_court = (case.get("court") or "").strip()
            if not assigned or case_court != assigned:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only update cases for your assigned court"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Prepare update data
        update_data = {}
        if update_request.status:
            update_data["status"] = update_request.status
        if update_request.classification:
            update_data["classification"] = update_request.classification
        if update_request.suggestions:
            update_data["suggestions"] = update_request.suggestions
        if update_request.summary:
            update_data["summary"] = update_request.summary
        if update_request.court:
            update_data["court"] = update_request.court
        if update_request.district:
            update_data["district"] = update_request.district
        if update_request.lawyerName:
            update_data["lawyerName"] = update_request.lawyerName
        if update_request.caseDate is not None:
            update_data["caseDate"] = update_request.caseDate
        
        # Update case
        updated_case = await case_service.update_case(case_id, update_data)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Case updated successfully",
                "case": updated_case
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating case: {str(e)}"
        )


@router.delete("/{case_id}")
async def delete_case(
    case_id: str,
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Delete a case
    """
    try:
        # Get existing case
        case = await case_service.get_case_by_id(case_id)
        
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )
        
        # Verify permissions: owner, admin, or court_staff for their assigned court
        role = current_user.get("role")
        if case["userId"] == current_user.get("user_id"):
            pass
        elif role == "admin":
            pass
        elif role == "court_staff":
            assigned = (current_user.get("assignedCourt") or "").strip()
            case_court = (case.get("court") or "").strip()
            if not assigned or case_court != assigned:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only delete cases for your assigned court"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Delete uploaded files
        if case.get("uploadedFiles"):
            for filename in case["uploadedFiles"]:
                file_path = UPLOAD_DIR / filename
                if file_path.exists():
                    file_path.unlink()
        
        # Delete case
        deleted = await case_service.delete_case(case_id)
        
        if deleted:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"message": "Case deleted successfully"}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete case"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting case: {str(e)}"
        )


@router.get("/search/{user_id}")
async def search_cases(
    user_id: str,
    query: str,
    current_user: dict = Depends(verify_token),
    case_service: CaseService = Depends(get_case_service)
):
    """
    Search cases by title or description
    """
    try:
        # Verify permissions
        if current_user.get("user_id") != user_id and current_user.get("role") not in ["admin", "judge"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        cases = await case_service.search_cases(user_id, query)
        return cases
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching cases: {str(e)}"
        )