from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from backend.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import verify_token
from backend.app.repositories.user_repo import UserRepository
from backend.app.models.user import User
from backend.app.services.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    user = UserRepository.get_by_email(db, email)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return user

class RoleChecker:
    def __init__(self, min_role: str):
        self.min_role = min_role

    def __call__(self, current_user: User = Depends(get_current_user)) -> bool:
        # AuthService.check_min_role raises exception if unauthorized
        AuthService.check_min_role(current_user, self.min_role)
        return True
