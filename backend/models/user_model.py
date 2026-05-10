from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, EmailStr
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


class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    fullName: str
    email: EmailStr
    password: str
    role: str = "lawyer"  # lawyer, judge, staff, admin
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "fullName": "John Doe",
                "email": "john.doe@example.com",
                "password": "hashed_password_here",
                "role": "lawyer"
            }
        }
    }


class UserResponse(BaseModel):
    id: str
    fullName: str
    email: EmailStr
    role: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "fullName": "John Doe",
                "email": "john.doe@example.com",
                "role": "lawyer"
            }
        }
    }