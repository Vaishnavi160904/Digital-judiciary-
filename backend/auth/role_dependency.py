from fastapi import Depends, HTTPException,APIRouter
from jose import jwt
from fastapi.security import OAuth2PasswordBearer,HTTPBearer
import os
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()
security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["Authentication"])

# ✅ PUT IT HERE
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)):

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


def require_role(allowed_roles: list):
    def role_checker(credentials=Depends(security)):
        token = credentials.credentials

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            role = payload.get("role")

            if role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Access denied")

            return payload

        except:
            raise HTTPException(status_code=401, detail="Invalid token")

    return role_checker