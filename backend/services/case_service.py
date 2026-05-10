from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from models.case_model import CaseModel, CaseStatsResponse


class CaseService:
    def __init__(self, db):
        self.collection = db["cases"]

    async def create_case(self, case_data: dict) -> dict:
        """Create a new case"""
        case_data["createdAt"] = datetime.utcnow()
        case_data["updatedAt"] = datetime.utcnow()
        case_data["status"] = "pending"
        
        # Generate case ID
        count = await self.collection.count_documents({})
        case_data["caseId"] = f"CASE-{count + 1:06d}"
        
        result = await self.collection.insert_one(case_data)
        case_data["_id"] = str(result.inserted_id)
        return case_data

    async def get_case_by_id(self, case_id: str) -> Optional[dict]:
        """Get a case by ID"""
        if not ObjectId.is_valid(case_id):
            return None
        
        case = await self.collection.find_one({"_id": ObjectId(case_id)})
        if case:
            case["_id"] = str(case["_id"])
        return case

    async def get_cases_by_user(self, user_id: str) -> List[dict]:
        """Get all cases for a user"""
        cursor = self.collection.find({"userId": user_id}).sort("createdAt", -1)
        cases = await cursor.to_list(length=None)
        
        for case in cases:
            case["_id"] = str(case["_id"])
        
        return cases

    async def get_recent_cases(self, user_id: str, limit: int = 5) -> List[dict]:
        """Get recent cases for a user"""
        cursor = self.collection.find({"userId": user_id}).sort("createdAt", -1).limit(limit)
        cases = await cursor.to_list(length=limit)
        
        for case in cases:
            case["_id"] = str(case["_id"])
        
        return cases

    async def update_case(self, case_id: str, update_data: dict) -> Optional[dict]:
        """Update a case"""
        if not ObjectId.is_valid(case_id):
            return None
        
        update_data["updatedAt"] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(case_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
        
        return result

    async def delete_case(self, case_id: str) -> bool:
        """Delete a case"""
        if not ObjectId.is_valid(case_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(case_id)})
        return result.deleted_count > 0

    async def get_user_stats(self, user_id: str) -> CaseStatsResponse:
        """Get case statistics for a user"""
        pipeline = [
            {"$match": {"userId": user_id}},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        cursor = self.collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        stats = {
            "totalCases": 0,
            "pendingCases": 0,
            "resolvedCases": 0,
            "activeCases": 0
        }
        
        for result in results:
            status = result["_id"]
            count = result["count"]
            stats["totalCases"] += count
            
            if status == "pending":
                stats["pendingCases"] = count
            elif status == "resolved":
                stats["resolvedCases"] = count
            elif status == "active":
                stats["activeCases"] = count
        
        return CaseStatsResponse(**stats)

    async def search_cases(self, user_id: str, query: str) -> List[dict]:
        """Search cases by title or description"""
        cursor = self.collection.find({
            "userId": user_id,
            "$or": [
                {"caseTitle": {"$regex": query, "$options": "i"}},
                {"caseDescription": {"$regex": query, "$options": "i"}},
                {"caseId": {"$regex": query, "$options": "i"}}
            ]
        }).sort("createdAt", -1)
        
        cases = await cursor.to_list(length=None)
        
        for case in cases:
            case["_id"] = str(case["_id"])
        
        return cases

    async def get_all_cases(self) -> List[dict]:
        """Get all cases (for judges and court staff)"""
        cursor = self.collection.find({}).sort("createdAt", -1)
        cases = await cursor.to_list(length=None)
        
        for case in cases:
            case["_id"] = str(case["_id"])
        
        return cases