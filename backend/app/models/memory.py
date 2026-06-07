import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class ResolvedIssue(Base):
    __tablename__ = "resolved_issues"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    ticket_id = Column(String, ForeignKey("jira_tickets.id", ondelete="SET NULL"), nullable=True)
    problem_description = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    solution_details = Column(Text, nullable=False)
    expert_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant")
    ticket = relationship("JiraTicket", back_populates="resolved_issues")
    expert = relationship("User")
