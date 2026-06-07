from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, Dict
from datetime import timedelta

from backend.app.repositories.tenant_repo import TenantRepository
from backend.app.repositories.user_repo import UserRepository
from backend.app.core.security import verify_password, create_access_token
from backend.app.core.exceptions import TenantValidationError, UserValidationError, PermissionDeniedError
from backend.app.models.user import User

ROLE_HIERARCHY = {
    "SUPER_ADMIN": 7,
    "ORG_ADMIN": 6,
    "EXECUTIVE": 5,
    "MANAGER": 4,
    "HR": 3,
    "TEAM_LEAD": 2,
    "EMPLOYEE": 1
}

class AuthService:
    @staticmethod
    def register_tenant(db: Session, tenant_name: str, domain: str, admin_email: str, admin_password: str, admin_name: str) -> Dict:
        # Validate domain does not exist
        existing_tenant = TenantRepository.get_by_domain(db, domain)
        if existing_tenant:
            raise TenantValidationError("Organization domain already registered.")

        # Validate admin email does not exist
        existing_user = UserRepository.get_by_email(db, admin_email)
        if existing_user:
            raise UserValidationError("Admin email already registered.")

        # Create Tenant
        tenant = TenantRepository.create(db, name=tenant_name, domain=domain, subscription_plan="STARTER")
        
        # Create Org Admin User
        admin_user = UserRepository.create(
            db,
            tenant_id=tenant.id,
            email=admin_email,
            password=admin_password,
            full_name=admin_name,
            role="ORG_ADMIN"
        )
        
        return {"tenant": tenant, "admin": admin_user}

    @staticmethod
    def login(db: Session, email: str, password: str) -> Dict:
        user = UserRepository.get_by_email(db, email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise PermissionDeniedError("Your account is deactivated.")

        # Generate JWT
        access_token = create_access_token(
            data={"sub": user.email, "tenant_id": user.tenant_id, "role": user.role, "user_id": user.id}
        )
        return {"access_token": access_token, "token_type": "bearer"}

    @staticmethod
    def check_min_role(user: User, required_role: str) -> bool:
        user_val = ROLE_HIERARCHY.get(user.role, 0)
        required_val = ROLE_HIERARCHY.get(required_role, 9)
        if user_val < required_val:
            raise PermissionDeniedError(f"Minimum role {required_role} required. You are logged in as {user.role}.")
        return True
