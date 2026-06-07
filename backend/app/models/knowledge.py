import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=True)  # Might be null for plain text/Gmail content stored directly
    file_type = Column(String, default="TXT")  # PDF, DOCX, PPTX, TXT, GOOGLE_DOC, EMAIL, TRANSCRIPT, MOM
    source_type = Column(String, default="UPLOAD")  # UPLOAD, GOOGLE_DRIVE, GMAIL, MEETING
    size_bytes = Column(Integer, default=0)
    metadata_json = Column(Text, default="{}")  # Stores source url, gmail id, search links
    content_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="documents")
