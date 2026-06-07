from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.models.user import User
from backend.app.core.security import get_password_hash

class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create(db: Session, tenant_id: str, email: str, password: str, full_name: str, role: str = "EMPLOYEE") -> User:
        db_user = User(
            tenant_id=tenant_id,
            email=email,
            password_hash=get_password_hash(password),
            full_name=full_name,
            role=role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def list_by_tenant(db: Session, tenant_id: str) -> List[User]:
        return db.query(User).filter(User.tenant_id == tenant_id).all()

    @staticmethod
    def update_role(db: Session, user_id: str, new_role: str) -> Optional[User]:
        user = UserRepository.get_by_id(db, user_id)
        if user:
            user.role = new_role
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def save_google_token(db: Session, user_id: str, refresh_token: str) -> Optional[User]:
        user = UserRepository.get_by_id(db, user_id)
        if user:
            user.google_refresh_token = refresh_token
            db.commit()
            db.refresh(user)
        return user
