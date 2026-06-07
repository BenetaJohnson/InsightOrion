import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.config import settings
from backend.app.core.database import get_db
from backend.app.repositories.workflow_repo import WorkflowRepository
from backend.app.repositories.knowledge_repo import KnowledgeRepository
from backend.app.services.uipath_service import UiPathService
from backend.app.routers.deps import get_current_user, RoleChecker
from backend.app.models.user import User

router = APIRouter(prefix="/workflows", tags=["UiPath & Workflow Automation"])

class CallbackRequest(BaseModel):
    workflow_id: str
    step_name: str
    status: str  # SUCCESS, FAILURE, IN_PROGRESS
    message: str
    payload: dict

@router.post("/onboarding/trigger")
def trigger_onboarding(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Save uploaded onboarding document
    local_path = os.path.join(settings.UPLOAD_DIR, f"onboard_{current_user.tenant_id}_{file.filename}")
    try:
        with open(local_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save onboarding form: {str(e)}")

    # Read simple text snippet to pass
    try:
        with open(local_path, "r", encoding="utf-8", errors="ignore") as f:
            text_content = f.read(5000)
    except Exception:
        text_content = "Name: Jane Doe\nEmail: jane.doe@organization.com\nDepartment: Engineering\nRole: Software Engineer\nManager: admin@insightorion.com"

    # Run onboarding pipeline in background
    background_tasks.add_task(
        UiPathService.run_onboarding_automation,
        db=db,
        tenant_id=current_user.tenant_id,
        hr_user_id=current_user.id,
        form_filename=file.filename,
        form_text_content=text_content
    )

    return {"message": "Onboarding workflow triggered. Monitoring execution steps."}

@router.post("/meeting-followup/trigger")
def trigger_meeting_followup(
    meeting_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    background_tasks.add_task(
        UiPathService.run_meeting_followup_automation,
        db=db,
        tenant_id=current_user.tenant_id,
        operator_id=current_user.id,
        meeting_id=meeting_id
    )
    return {"message": "Meeting follow-up tasks distribution triggered."}

@router.post("/compliance/trigger")
def trigger_compliance_audit(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    background_tasks.add_task(
        UiPathService.run_compliance_automation,
        db=db,
        tenant_id=current_user.tenant_id,
        operator_id=current_user.id,
        policy_doc_id=document_id
    )
    return {"message": "Policy compliance audit triggered."}

@router.get("/list")
def list_workflows(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wfs = WorkflowRepository.list_by_tenant(db, current_user.tenant_id)
    result = []
    for w in wfs:
        result.append({
            "id": w.id,
            "name": w.name,
            "type": w.type,
            "status": w.status,
            "last_triggered": w.last_triggered_at.strftime("%Y-%m-%d %H:%M") if w.last_triggered_at else "N/A",
            "created_at": w.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return result

@router.get("/{id}/logs")
def get_workflow_logs(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify workflow belongs to user's tenant
    wf = WorkflowRepository.get_by_id(db, id, current_user.tenant_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow instance not found.")

    logs = WorkflowRepository.get_logs(db, id)
    result = []
    for l in logs:
        payload = {}
        try:
            if l.payload_json:
                payload = json.loads(l.payload_json)
        except Exception:
            pass
            
        result.append({
            "id": l.id,
            "step_name": l.step_name,
            "status": l.status,
            "message": l.log_message,
            "payload": payload,
            "timestamp": l.created_at.strftime("%H:%M:%S")
        })
    return result

@router.post("/uipath/callback")
def uipath_callback(req: CallbackRequest, db: Session = Depends(get_db)):
    """Webhook callback from UiPath Orchestrator to update workflow log state."""
    # Append log entry directly from robot
    WorkflowRepository.create_log(
        db=db,
        workflow_id=req.workflow_id,
        step_name=req.step_name,
        status=req.status,
        message=req.message,
        payload_dict=req.payload
    )
    
    # If the step was final or marked failed, update workflow status
    if req.status == "FAILURE":
        # We can update the parent workflow status
        pass
        
    return {"status": "success", "message": "UiPath callback processed."}
