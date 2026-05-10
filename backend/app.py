from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db.mongodb import connect_to_mongo, close_mongo_connection
from auth.auth_routes import router as auth_router
from routes.case_routes import router as case_router
from routes.lawgpt_routes import router as lawgpt_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="Digital Judiciary API",
    description="AI-Powered Digital Judiciary System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(case_router)
app.include_router(lawgpt_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Digital Judiciary API",
        "version": "1.0.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5000))
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=True
    )