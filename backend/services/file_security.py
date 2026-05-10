import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("FILE_SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("FILE_SECRET_KEY not found in .env")

fernet = Fernet(SECRET_KEY)

def encrypt_file(data: bytes) -> bytes:
    return fernet.encrypt(data)