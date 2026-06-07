from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.app.core.database import get_db
from backend.app.services.privacy_service import PrivacyService
from backend.app.routers.deps import get_current_user
from backend.app.models.privacy import PrivacyAuditLog
from backend.app.models.user import User

router = APIRouter(prefix="/privacy", tags=["Privacy, Compliance & Redaction"])

class ScanTextRequest(BaseModel):
    text: str

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(PrivacyAuditLog).filter(
        PrivacyAuditLog.tenant_id == current_user.tenant_id
    ).order_by(PrivacyAuditLog.created_at.desc()).all()
    
    result = []
    for l in logs:
        result.append({
            "id": l.id,
            "source_id": l.source_id,
            "redacted_type": l.redacted_type,
            "count": l.count,
            "log_details": l.log_details,
            "created_at": l.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return result

@router.post("/scan-text")
def test_scan_text(req: ScanTextRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        sanitized = PrivacyService.sanitize(db, current_user.tenant_id, "live_scanner_api", req.text)
        return {
            "original_text": req.text,
            "sanitized_text": sanitized
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
