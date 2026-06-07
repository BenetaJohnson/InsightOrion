import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class JiraTicket(Base):
    __tablename__ = "jira_tickets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    key = Column(String, nullable=False, unique=True)  # e.g., "PROJ-123"
    project_key = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="TO_DO")  # TO_DO, IN_PROGRESS, RESOLVED, CLOSED
    priority = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, BLOCKER
    assignee_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reporter_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sprint_name = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant")
    resolved_issues = relationship("ResolvedIssue", back_populates="ticket", cascade="all, delete-orphan")
