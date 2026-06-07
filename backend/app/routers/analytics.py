from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models.knowledge import Document
from backend.app.models.meeting import Meeting, ActionItem
from backend.app.routers.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])

@router.get("/dashboard")
def get_analytics_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant_id = current_user.tenant_id

    # 1. Knowledge Analytics
    doc_count = db.query(Document).filter(Document.tenant_id == tenant_id).count()
    doc_by_type = db.query(Document.file_type, func.count(Document.id)).filter(Document.tenant_id == tenant_id).group_by(Document.file_type).all()
    type_distribution = {t: c for t, c in doc_by_type}
    
    # 2. Meetings Analytics
    meeting_count = db.query(Meeting).filter(Meeting.tenant_id == tenant_id).count()
    completed_meetings = db.query(Meeting).filter(Meeting.tenant_id == tenant_id, Meeting.status == "COMPLETED").count()
    processing_meetings = db.query(Meeting).filter(Meeting.tenant_id == tenant_id, Meeting.status == "PROCESSING").count()

    # 3. Productivity Tasks Analytics
    actions = db.query(ActionItem).filter(ActionItem.tenant_id == tenant_id).all()
    open_actions = sum(1 for a in actions if a.status == "OPEN")
    inprogress_actions = sum(1 for a in actions if a.status == "IN_PROGRESS")
    completed_actions = sum(1 for a in actions if a.status == "COMPLETED")
    overdue_actions = sum(1 for a in actions if a.status == "OVERDUE")

    # Calculated risk allocations
    high_risk_tasks = sum(1 for a in actions if a.delay_risk == "HIGH" and a.status != "COMPLETED")

    # 4. AI Gemini Usage & Costs Estimates
    # Simulates queries counter
    mock_query_volume = 125 if doc_count > 0 else 0
    whisper_minutes = int(meeting_count * 4.5)  # Estimate average 4.5 mins per meeting
    gemini_tokens = int(mock_query_volume * 1200 + meeting_count * 15000)
    
    # Pricing reference: Whisper $0.006/min, Gemini 2.5 Flash $0.075/million input tokens
    whisper_cost = whisper_minutes * 0.006
    gemini_cost = (gemini_tokens / 1000000) * 0.075
    estimated_cost = round(whisper_cost + gemini_cost, 4)

    return {
        "knowledge": {
            "total_documents": doc_count,
            "type_distribution": type_distribution,
            "popular_topics": [
                {"topic": "Project Alpha AWS Migration", "searches": 48},
                {"topic": "SOC2 security handbook policies", "searches": 32},
                {"topic": "GCP VM resource estimations", "searches": 15}
            ]
        },
        "meetings": {
            "total_processed": meeting_count,
            "completed": completed_meetings,
            "processing": processing_meetings,
            "minutes_transcribed": whisper_minutes
        },
        "productivity": {
            "total_actions": len(actions),
            "open": open_actions,
            "in_progress": inprogress_actions,
            "completed": completed_actions,
            "overdue": overdue_actions,
            "high_risk_tasks": high_risk_tasks
        },
        "ai_usage": {
            "query_volume": mock_query_volume,
            "total_tokens_consumed": gemini_tokens,
            "estimated_billing_usd": estimated_cost
        }
    }
