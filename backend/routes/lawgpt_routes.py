from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from db.mongodb import get_database
from services.lawgpt_service import ask_lawgpt, LawGPTService
from auth.auth_utils import verify_token

router = APIRouter(prefix="/lawgpt", tags=["LawGPT"])


# =========================
# MODELS
# =========================

class ChatRequest(BaseModel):
    question: str
    context: Optional[str] = ""


class ChatResponse(BaseModel):
    answer: str


class SaveChatRequest(BaseModel):
    title: str
    messages: List[dict]


class AnalyzeRequest(BaseModel):
    caseTitle: str
    caseDescription: str
    caseType: str = "General"


# =========================
# AI CHAT (Simple RAG)
# =========================

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Chat with LawGPT using RAG (simple question-answer)
    """
    try:
        answer = ask_lawgpt(req.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )


# =========================
# ADVANCED CHAT WITH CONTEXT
# =========================

@router.post("/chat-advanced")
async def chat_advanced(
    req: ChatRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Advanced chat with context and authentication
    """
    try:
        lawgpt_service = LawGPTService()
        
        response = await lawgpt_service.chat_query(
            question=req.question,
            context=req.context
        )
        
        return {
            "question": req.question,
            "answer": response
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat request: {str(e)}"
        )


# =========================
# ANALYZE CASE
# =========================

@router.post("/analyze")
async def analyze_case(
    analyze_request: AnalyzeRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Analyze case text without saving to database
    """
    try:
        lawgpt_service = LawGPTService()
        
        analysis = await lawgpt_service.analyze_case(
            case_title=analyze_request.caseTitle,
            case_description=analyze_request.caseDescription,
            case_type=analyze_request.caseType
        )
        
        return analysis
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing case: {str(e)}"
        )


# =========================
# QUERY LEGAL DOCUMENTS
# =========================

@router.get("/query-documents")
async def query_legal_documents(
    query: str,
    current_user: dict = Depends(verify_token)
):
    """
    Query legal documents using RAG
    """
    try:
        lawgpt_service = LawGPTService()
        
        response = lawgpt_service.query_legal_documents(query)
        
        return {
            "query": query,
            "response": response
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error querying documents: {str(e)}"
        )


# =========================
# SAVE CHAT HISTORY
# =========================

@router.post("/save")
async def save_chat(
    data: SaveChatRequest,
    current_user: dict = Depends(verify_token),
    db = Depends(get_database)
):
    """
    Save chat conversation to database
    """
    try:
        chat_collection = db["lawgpt_chats"]
        
        chat_data = {
            "user_id": current_user.get("user_id"),
            "title": data.title,
            "messages": data.messages,
            "created_at": datetime.utcnow()
        }

        result = await chat_collection.insert_one(chat_data)

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={"id": str(result.inserted_id), "message": "Chat saved successfully"}
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving chat: {str(e)}"
        )


# =========================
# GET CHAT HISTORY
# =========================

@router.get("/history")
async def get_history(
    current_user: dict = Depends(verify_token),
    db = Depends(get_database)
):
    """
    Get user's chat history
    """
    try:
        chat_collection = db["lawgpt_chats"]
        
        cursor = chat_collection.find({"user_id": current_user.get("user_id")}).sort("created_at", -1)
        chats = await cursor.to_list(length=None)

        for chat in chats:
            chat["_id"] = str(chat["_id"])
            if "created_at" in chat:
                chat["created_at"] = chat["created_at"].isoformat()

        return chats
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching chat history: {str(e)}"
        )


# =========================
# GET SPECIFIC CHAT
# =========================

@router.get("/history/{chat_id}")
async def get_chat(
    chat_id: str,
    current_user: dict = Depends(verify_token),
    db = Depends(get_database)
):
    """
    Get a specific chat by ID
    """
    try:
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid chat ID"
            )
        
        chat_collection = db["lawgpt_chats"]
        
        chat = await chat_collection.find_one({
            "_id": ObjectId(chat_id),
            "user_id": current_user.get("user_id")
        })

        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )

        chat["_id"] = str(chat["_id"])
        if "created_at" in chat:
            chat["created_at"] = chat["created_at"].isoformat()

        return chat
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching chat: {str(e)}"
        )


# =========================
# DELETE CHAT
# =========================

@router.delete("/history/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user: dict = Depends(verify_token),
    db = Depends(get_database)
):
    """
    Delete a specific chat
    """
    try:
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid chat ID"
            )
        
        chat_collection = db["lawgpt_chats"]
        
        result = await chat_collection.delete_one({
            "_id": ObjectId(chat_id),
            "user_id": current_user.get("user_id")
        })

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Chat deleted successfully"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting chat: {str(e)}"
        )