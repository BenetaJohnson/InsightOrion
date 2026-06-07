from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.models.tenant import Tenant

class TenantRepository:
    @staticmethod
    def get_by_id(db: Session, tenant_id: str) -> Optional[Tenant]:
        return db.query(Tenant).filter(Tenant.id == tenant_id).first()

    @staticmethod
    def get_by_domain(db: Session, domain: str) -> Optional[Tenant]:
        return db.query(Tenant).filter(Tenant.domain == domain).first()

    @staticmethod
    def create(db: Session, name: str, domain: str, subscription_plan: str = "STARTER") -> Tenant:
        db_tenant = Tenant(
            name=name,
            domain=domain,
            subscription_plan=subscription_plan
        )
        db.add(db_tenant)
        db.commit()
        db.refresh(db_tenant)
        return db_tenant

    @staticmethod
    def list_all(db: Session) -> List[Tenant]:
        return db.query(Tenant).all()
        
    @staticmethod
    def update_storage(db: Session, tenant_id: str, bytes_added: int) -> Optional[Tenant]:
        tenant = TenantRepository.get_by_id(db, tenant_id)
        if tenant:
            tenant.storage_used += bytes_added
            db.commit()
            db.refresh(tenant)
        return tenant
