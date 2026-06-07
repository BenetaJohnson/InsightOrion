import json
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Dict
from backend.app.models.meeting import Meeting, ActionItem, Comment

class MeetingRepository:
    # --- Meetings ---
    @staticmethod
    def get_by_id(db: Session, meeting_id: str, tenant_id: str) -> Optional[Meeting]:
        return db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.tenant_id == tenant_id
        ).first()

    @staticmethod
    def create_meeting(
        db: Session,
        tenant_id: str,
        title: str,
        date: str,
        duration_seconds: int = 0,
        video_audio_path: Optional[str] = None
    ) -> Meeting:
        db_meeting = Meeting(
            tenant_id=tenant_id,
            title=title,
            date=date,
            duration_seconds=duration_seconds,
            video_audio_path=video_audio_path,
            status="PENDING"
        )
        db.add(db_meeting)
        db.commit()
        db.refresh(db_meeting)
        return db_meeting

    @staticmethod
    def list_by_tenant(db: Session, tenant_id: str) -> List[Meeting]:
        return db.query(Meeting).filter(Meeting.tenant_id == tenant_id).order_by(Meeting.created_at.desc()).all()

    @staticmethod
    def update_meeting_results(
        db: Session,
        meeting_id: str,
        tenant_id: str,
        transcript: str,
        speaker_segments: List[dict],
        mom_data: dict,
        status: str = "COMPLETED"
    ) -> Optional[Meeting]:
        meeting = MeetingRepository.get_by_id(db, meeting_id, tenant_id)
        if meeting:
            meeting.transcript_text = transcript
            meeting.speaker_segments_json = json.dumps(speaker_segments)
            meeting.mom_json = json.dumps(mom_data)
            meeting.status = status
            db.commit()
            db.refresh(meeting)
        return meeting

    # --- Action Items ---
    @staticmethod
    def get_action_by_id(db: Session, action_id: str, tenant_id: str) -> Optional[ActionItem]:
        return db.query(ActionItem).filter(
            ActionItem.id == action_id,
            ActionItem.tenant_id == tenant_id
        ).first()

    @staticmethod
    def create_action_item(
        db: Session,
        tenant_id: str,
        meeting_id: Optional[str],
        title: str,
        description: Optional[str],
        assignee_id: Optional[str],
        priority: str = "MEDIUM",
        due_date: Optional[str] = None,
        risk_score: float = 0.0,
        delay_risk: str = "LOW"
    ) -> ActionItem:
        db_action = ActionItem(
            tenant_id=tenant_id,
            meeting_id=meeting_id,
            title=title,
            description=description,
            assignee_id=assignee_id,
            priority=priority,
            due_date=due_date,
            status="OPEN",
            risk_score=risk_score,
            delay_risk=delay_risk
        )
        db.add(db_action)
        db.commit()
        db.refresh(db_action)
        return db_action

    @staticmethod
    def list_actions_by_tenant(db: Session, tenant_id: str) -> List[ActionItem]:
        return db.query(ActionItem).filter(ActionItem.tenant_id == tenant_id).order_by(ActionItem.due_date.asc()).all()

    @staticmethod
    def update_action_status(db: Session, action_id: str, tenant_id: str, status: str, risk_score: Optional[float] = None, delay_risk: Optional[str] = None) -> Optional[ActionItem]:
        action = MeetingRepository.get_action_by_id(db, action_id, tenant_id)
        if action:
            action.status = status
            if risk_score is not None:
                action.risk_score = risk_score
            if delay_risk is not None:
                action.delay_risk = delay_risk
            db.commit()
            db.refresh(action)
        return action

    # --- Comments ---
    @staticmethod
    def add_comment(db: Session, action_item_id: str, author_id: str, content: str) -> Comment:
        db_comment = Comment(
            action_item_id=action_item_id,
            author_id=author_id,
            content=content
        )
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        return db_comment

    @staticmethod
    def get_comments_for_action(db: Session, action_item_id: str) -> List[Comment]:
        return db.query(Comment).filter(Comment.action_item_id == action_item_id).order_by(Comment.created_at.asc()).all()
