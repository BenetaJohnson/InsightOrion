from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.app.core.database import get_db
from backend.app.repositories.meeting_repo import MeetingRepository
from backend.app.routers.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/actions", tags=["Action Item Tracking"])

class StatusUpdateRequest(BaseModel):
    status: str  # OPEN, IN_PROGRESS, COMPLETED, OVERDUE
    risk_score: Optional[float] = None
    delay_risk: Optional[str] = None  # LOW, MEDIUM, HIGH

class CommentCreateRequest(BaseModel):
    content: str

@router.get("")
def list_actions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    actions = MeetingRepository.list_actions_by_tenant(db, current_user.tenant_id)
    result = []
    for a in actions:
        # Resolve assignee email
        assignee = db.query(backend.app.models.user.User).filter(backend.app.models.user.User.id == a.assignee_id).first()
        assignee_name = assignee.full_name if assignee else "Unassigned"
        assignee_email = assignee.email if assignee else "N/A"
        
        result.append({
            "id": a.id,
            "meeting_id": a.meeting_id,
            "title": a.title,
            "description": a.description,
            "assignee_id": a.assignee_id,
            "assignee_name": assignee_name,
            "assignee_email": assignee_email,
            "priority": a.priority,
            "due_date": a.due_date,
            "status": a.status,
            "risk_score": a.risk_score,
            "delay_risk": a.delay_risk,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return result

@router.put("/{id}/status")
def update_action_status(
    id: str,
    req: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = MeetingRepository.get_action_by_id(db, id, current_user.tenant_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action item not found.")

    # Calculate AI risk score adjustments dynamically if not provided
    risk = req.risk_score
    delay = req.delay_risk
    
    if req.status == "COMPLETED":
        risk = 0.0
        delay = "LOW"
    elif req.status == "OVERDUE":
        risk = 9.0
        delay = "HIGH"

    updated = MeetingRepository.update_action_status(
        db=db,
        action_id=id,
        tenant_id=current_user.tenant_id,
        status=req.status,
        risk_score=risk,
        delay_risk=delay
    )
    return {"message": "Action item status updated successfully.", "action_status": updated.status}

@router.post("/{id}/comments")
def add_action_comment(
    id: str,
    req: CommentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = MeetingRepository.get_action_by_id(db, id, current_user.tenant_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action item not found.")

    comment = MeetingRepository.add_comment(
        db=db,
        action_item_id=id,
        author_id=current_user.id,
        content=req.content
    )
    return {
        "message": "Comment added successfully.",
        "comment_id": comment.id,
        "author": current_user.full_name,
        "created_at": comment.created_at.strftime("%Y-%m-%d %H:%M")
    }

@router.get("/{id}/comments")
def get_action_comments(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    action = MeetingRepository.get_action_by_id(db, id, current_user.tenant_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action item not found.")

    comments = MeetingRepository.get_comments_for_action(db, id)
    result = []
    for c in comments:
        author = db.query(backend.app.models.user.User).filter(backend.app.models.user.User.id == c.author_id).first()
        author_name = author.full_name if author else "System AI"
        result.append({
            "id": c.id,
            "content": c.content,
            "author": author_name,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return result
import backend.app.models.user
