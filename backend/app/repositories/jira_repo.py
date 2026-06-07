from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.models.jira import JiraTicket

class JiraRepository:
    @staticmethod
    def get_by_id(db: Session, ticket_id: str, tenant_id: str) -> Optional[JiraTicket]:
        return db.query(JiraTicket).filter(
            JiraTicket.id == ticket_id,
            JiraTicket.tenant_id == tenant_id
        ).first()

    @staticmethod
    def get_by_key(db: Session, key: str, tenant_id: str) -> Optional[JiraTicket]:
        return db.query(JiraTicket).filter(
            JiraTicket.key == key,
            JiraTicket.tenant_id == tenant_id
        ).first()

    @staticmethod
    def list_by_tenant(db: Session, tenant_id: str) -> List[JiraTicket]:
        return db.query(JiraTicket).filter(JiraTicket.tenant_id == tenant_id).order_by(JiraTicket.created_at.desc()).all()

    @staticmethod
    def create_ticket(
        db: Session,
        tenant_id: str,
        key: str,
        project_key: str,
        title: str,
        description: Optional[str] = None,
        status: str = "TO_DO",
        priority: str = "MEDIUM",
        assignee_id: Optional[str] = None,
        reporter_id: Optional[str] = None,
        sprint_name: Optional[str] = None
    ) -> JiraTicket:
        # Check if already exists
        existing = JiraRepository.get_by_key(db, key, tenant_id)
        if existing:
            existing.title = title
            existing.description = description
            existing.status = status
            existing.priority = priority
            existing.assignee_id = assignee_id
            existing.sprint_name = sprint_name
            if status in ["RESOLVED", "CLOSED"] and not existing.resolved_at:
                existing.resolved_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing

        db_ticket = JiraTicket(
            tenant_id=tenant_id,
            key=key,
            project_key=project_key,
            title=title,
            description=description,
            status=status,
            priority=priority,
            assignee_id=assignee_id,
            reporter_id=reporter_id,
            sprint_name=sprint_name
        )
        if status in ["RESOLVED", "CLOSED"]:
            db_ticket.resolved_at = datetime.utcnow()
            
        db.add(db_ticket)
        db.commit()
        db.refresh(db_ticket)
        return db_ticket

    @staticmethod
    def update_ticket_status(db: Session, key: str, tenant_id: str, status: str) -> Optional[JiraTicket]:
        ticket = JiraRepository.get_by_key(db, key, tenant_id)
        if ticket:
            ticket.status = status
            if status in ["RESOLVED", "CLOSED"]:
                ticket.resolved_at = datetime.utcnow()
            else:
                ticket.resolved_at = None
            db.commit()
            db.refresh(ticket)
        return ticket
