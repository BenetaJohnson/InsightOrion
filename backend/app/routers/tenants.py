from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.core.database import get_db
from backend.app.repositories.tenant_repo import TenantRepository
from backend.app.routers.deps import get_current_user, RoleChecker
from backend.app.models.user import User

router = APIRouter(prefix="/tenants", tags=["Tenants Management"])

class TenantSettingsUpdate(BaseModel):
    name: str
    subscription_plan: str

@router.get("/me")
def get_tenant_details(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = TenantRepository.get_by_id(db, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant organization not found.")
    
    # Calculate storage limit based on subscription plan
    limits = {
        "STARTER": 100 * 1024 * 1024,      # 100 MB
        "PROFESSIONAL": 1024 * 1024 * 1024, # 1 GB
        "ENTERPRISE": 100 * 1024 * 1024 * 1024 # 100 GB
    }
    limit_bytes = limits.get(tenant.subscription_plan, limits["STARTER"])
    
    return {
        "id": tenant.id,
        "name": tenant.name,
        "domain": tenant.domain,
        "subscription_plan": tenant.subscription_plan,
        "storage_used_bytes": tenant.storage_used,
        "storage_limit_bytes": limit_bytes,
        "created_at": tenant.created_at
    }

@router.put("/me", dependencies=[Depends(RoleChecker("ORG_ADMIN"))])
def update_tenant_details(req: TenantSettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = TenantRepository.get_by_id(db, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant organization not found.")
    
    tenant.name = req.name
    tenant.subscription_plan = req.subscription_plan
    db.commit()
    db.refresh(tenant)
    return {"message": "Tenant settings updated successfully."}
