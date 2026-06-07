from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.app.core.database import get_db
from backend.app.repositories.jira_repo import JiraRepository
from backend.app.services.jira_service import JiraService
from backend.app.routers.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/jira", tags=["Jira Copilot & Engineering Intelligence"])

@router.post("/sync")
def sync_jira(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        count = JiraService.sync_jira_tickets(db, current_user.tenant_id)
        return {
            "message": "Jira projects tickets successfully synchronized.",
            "tickets_synced": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tickets")
def get_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tickets = JiraRepository.list_by_tenant(db, current_user.tenant_id)
    result = []
    for t in tickets:
        # Resolve assignee email
        assignee = db.query(backend.app.models.user.User).filter(backend.app.models.user.User.id == t.assignee_id).first()
        assignee_email = assignee.email if assignee else "Unassigned"
        
        result.append({
            "id": t.id,
            "key": t.key,
            "project_key": t.project_key,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "assignee_email": assignee_email,
            "sprint_name": t.sprint_name,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return result

@router.get("/tickets/{key}/recommendations")
def get_ticket_recommendations(key: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        recs = JiraService.suggest_root_cause_and_recs(db, current_user.tenant_id, key)
        if "error" in recs:
            raise HTTPException(status_code=404, detail=recs["error"])
        return recs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expert-finder")
def find_experts(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        experts = JiraService.expert_finder(db, current_user.tenant_id, q)
        return experts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
import backend.app.models.user
