from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "digital_judiciary")

# Global client and database
client = None
database = None
db = None  # For direct access (backward compatibility)


async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database, db
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    db = database  # Set db for direct import
    print(f"✅ Connected to MongoDB: {DATABASE_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_database():
    """Get database instance (for dependency injection)"""
    return database


# For backward compatibility - direct db access
# Initialize synchronous connection for non-async routes
try:
    sync_client = AsyncIOMotorClient(MONGODB_URL)
    db = sync_client[DATABASE_NAME]
except Exception as e:
    print(f"Warning: Could not initialize MongoDB connection: {e}")
    db = None