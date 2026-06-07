import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class PrivacyAuditLog(Base):
    __tablename__ = "privacy_audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(String, nullable=False)  # meeting_id or document_id
    redacted_type = Column(String, nullable=False)  # PII_PHONE, PII_EMAIL, HR_SALARY, FINANCIAL, CONFIDENTIAL
    count = Column(Integer, default=0)
    log_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant")
