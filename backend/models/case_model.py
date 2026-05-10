from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema(
            [
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema(
                    [
                        core_schema.str_schema(),
                        core_schema.no_info_plain_validator_function(cls.validate),
                    ]
                ),
            ],
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(
        cls, schema: core_schema.CoreSchema, handler
    ) -> JsonSchemaValue:
        return {"type": "string"}


class CaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    caseId: Optional[str] = None
    userId: str
    
    # Personal Information
    fullName: str
    email: str
    phoneNumber: str
    address: str
    
    # Case Information
    caseTitle: str
    caseDescription: str
    caseType: str
    caseDate: str
    urgencyLevel: str = "Normal"
    
    # Court & Location Details
    court: str
    district: str
    state: str
    policeStation: Optional[str] = None
    firNumber: Optional[str] = None
    
    # Opposing Party Details
    opposingPartyName: Optional[str] = None
    opposingPartyAddress: Optional[str] = None
    
    # Legal Representative
    lawyerName: Optional[str] = None

    # Who submitted the case (logged-in user name, e.g. lawyer)
    submittedByName: Optional[str] = None
    
    # Evidence & Witnesses
    evidenceDescription: Optional[str] = None
    witnessDetails: Optional[str] = None
    
    # Uploaded Files
    uploadedFiles: Optional[List[str]] = []
    
    # Case Status & AI Analysis
    status: str = "pending"  # pending, active, resolved, rejected
    classification: Optional[str] = None
    suggestions: Optional[str] = None
    summary: Optional[str] = None
    
    # Timestamps
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "userId": "507f1f77bcf86cd799439011",
                "fullName": "John Doe",
                "email": "john.doe@example.com",
                "phoneNumber": "+91 9876543210",
                "address": "123 Main Street, City",
                "caseTitle": "Property Dispute",
                "caseDescription": "Detailed description of the case...",
                "caseType": "Civil",
                "caseDate": "2026-02-13",
                "urgencyLevel": "Normal",
                "court": "District Court",
                "district": "Mumbai",
                "state": "Maharashtra",
                "policeStation": "Marine Drive Police Station",
                "firNumber": "FIR/2026/12345",
                "opposingPartyName": "Jane Smith",
                "opposingPartyAddress": "456 Another Street",
                "lawyerName": "Adv. Rajesh Kumar",
                "evidenceDescription": "Documents, photos, and witness statements",
                "witnessDetails": "Mr. ABC - 9876543210, Ms. XYZ - 9876543211",
                "uploadedFiles": ["file1.pdf", "file2.jpg"],
                "status": "pending"
            }
        }
    }


class CaseSubmitRequest(BaseModel):
    userId: str
    fullName: str
    email: str
    phoneNumber: str
    address: str
    caseTitle: str
    caseDescription: str
    caseType: str
    caseDate: str
    urgencyLevel: str = "Normal"
    court: str
    district: str
    state: str
    policeStation: Optional[str] = None
    firNumber: Optional[str] = None
    opposingPartyName: Optional[str] = None
    opposingPartyAddress: Optional[str] = None
    lawyerName: Optional[str] = None
    evidenceDescription: Optional[str] = None
    witnessDetails: Optional[str] = None


class CaseUpdateRequest(BaseModel):
    status: Optional[str] = None
    classification: Optional[str] = None
    suggestions: Optional[str] = None
    summary: Optional[str] = None
    court: Optional[str] = None
    district: Optional[str] = None
    lawyerName: Optional[str] = None
    caseDate: Optional[str] = None  # Hearing date - staff can update


class CaseStatsResponse(BaseModel):
    totalCases: int = 0
    pendingCases: int = 0
    resolvedCases: int = 0
    activeCases: int = 0