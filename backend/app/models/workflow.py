import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # ONBOARDING, MEETING_FOLLOWUP, COMPLIANCE
    status = Column(String, default="IDLE")  # IDLE, ACTIVE, COMPLETED, FAILED
    config_json = Column(Text, default="{}")
    last_triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="workflows")
    logs = relationship("WorkflowLog", back_populates="workflow", cascade="all, delete-orphan")


class WorkflowLog(Base):
    __tablename__ = "workflow_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    step_name = Column(String, nullable=False)
    status = Column(String, default="IN_PROGRESS")  # SUCCESS, FAILURE, IN_PROGRESS
    log_message = Column(Text, nullable=True)
    payload_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    workflow = relationship("Workflow", back_populates="logs")
