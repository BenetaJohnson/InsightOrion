from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.models.memory import ResolvedIssue

class MemoryRepository:
    @staticmethod
    def get_by_id(db: Session, memory_id: str, tenant_id: str) -> Optional[ResolvedIssue]:
        return db.query(ResolvedIssue).filter(
            ResolvedIssue.id == memory_id,
            ResolvedIssue.tenant_id == tenant_id
        ).first()

    @staticmethod
    def list_by_tenant(db: Session, tenant_id: str) -> List[ResolvedIssue]:
        return db.query(ResolvedIssue).filter(
            ResolvedIssue.tenant_id == tenant_id
        ).order_by(ResolvedIssue.created_at.desc()).all()

    @staticmethod
    def register_resolution(
        db: Session,
        tenant_id: str,
        ticket_id: Optional[str],
        problem_description: str,
        root_cause: str,
        solution_details: str,
        expert_id: Optional[str] = None
    ) -> ResolvedIssue:
        db_mem = ResolvedIssue(
            tenant_id=tenant_id,
            ticket_id=ticket_id,
            problem_description=problem_description,
            root_cause=root_cause,
            solution_details=solution_details,
            expert_id=expert_id
        )
        db.add(db_mem)
        db.commit()
        db.refresh(db_mem)
        return db_mem
