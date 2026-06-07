from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, ConfigDict

from backend.app.core.database import get_db
from backend.app.services.auth_service import AuthService
from backend.app.services.google_service import GoogleService
from backend.app.routers.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

class TenantRegisterRequest(BaseModel):
    tenant_name: str
    domain: str
    admin_email: EmailStr
    admin_password: str
    admin_name: str

class UserResponse(BaseModel):
    id: str
    tenant_id: str
    email: str
    full_name: str
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

@router.post("/register")
def register(req: TenantRegisterRequest, db: Session = Depends(get_db)):
    try:
        result = AuthService.register_tenant(
            db=db,
            tenant_name=req.tenant_name,
            domain=req.domain,
            admin_email=req.admin_email,
            admin_password=req.admin_password,
            admin_name=req.admin_name
        )
        return {
            "message": "Tenant and organization admin account created successfully.",
            "tenant_id": result["tenant"].id,
            "admin_id": result["admin"].id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        return AuthService.login(db=db, email=form_data.username, password=form_data.password)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/google/authorize")
def google_authorize(current_user: User = Depends(get_current_user)):
    # Returns redirect link
    url = GoogleService.get_auth_url()
    return {"url": url}

@router.get("/google/callback")
def google_callback(code: str, state: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Exchange auth code
    res = GoogleService.exchange_code(db, current_user.id, code)
    return res
