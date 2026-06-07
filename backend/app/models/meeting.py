import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    duration_seconds = Column(Integer, default=0)
    video_audio_path = Column(String, nullable=True)
    transcript_text = Column(Text, nullable=True)
    speaker_segments_json = Column(Text, default="[]")
    mom_json = Column(Text, default="{}")
    status = Column(String, default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="meetings")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assignee_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    priority = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, URGENT
    due_date = Column(String, nullable=True)  # YYYY-MM-DD
    status = Column(String, default="OPEN")  # OPEN, IN_PROGRESS, COMPLETED, OVERDUE
    risk_score = Column(Float, default=0.0)  # Calculated delay/blocker score (0.0 to 10.0)
    delay_risk = Column(String, default="LOW")  # LOW, MEDIUM, HIGH
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="action_items")
    meeting = relationship("Meeting", back_populates="action_items")
    assignee = relationship("User", back_populates="action_items")
    comments = relationship("Comment", back_populates="action_item", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action_item_id = Column(String, ForeignKey("action_items.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    action_item = relationship("ActionItem", back_populates="comments")
