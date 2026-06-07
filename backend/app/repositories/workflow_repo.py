import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.models.workflow import Workflow, WorkflowLog

class WorkflowRepository:
    @staticmethod
    def get_by_id(db: Session, workflow_id: str, tenant_id: str) -> Optional[Workflow]:
        return db.query(Workflow).filter(
            Workflow.id == workflow_id,
            Workflow.tenant_id == tenant_id
        ).first()

    @staticmethod
    def create_workflow(db: Session, tenant_id: str, name: str, workflow_type: str, config_dict: dict) -> Workflow:
        db_workflow = Workflow(
            tenant_id=tenant_id,
            name=name,
            type=workflow_type,
            status="IDLE",
            config_json=json.dumps(config_dict)
        )
        db.add(db_workflow)
        db.commit()
        db.refresh(db_workflow)
        return db_workflow

    @staticmethod
    def list_by_tenant(db: Session, tenant_id: str) -> List[Workflow]:
        return db.query(Workflow).filter(Workflow.tenant_id == tenant_id).order_by(Workflow.created_at.desc()).all()

    @staticmethod
    def update_status(db: Session, workflow_id: str, tenant_id: str, status: str) -> Optional[Workflow]:
        workflow = WorkflowRepository.get_by_id(db, workflow_id, tenant_id)
        if workflow:
            workflow.status = status
            if status == "ACTIVE":
                workflow.last_triggered_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(workflow)
        return workflow

    @staticmethod
    def create_log(db: Session, workflow_id: str, step_name: str, status: str, message: str, payload_dict: dict) -> WorkflowLog:
        db_log = WorkflowLog(
            workflow_id=workflow_id,
            step_name=step_name,
            status=status,
            log_message=message,
            payload_json=json.dumps(payload_dict)
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    @staticmethod
    def get_logs(db: Session, workflow_id: str) -> List[WorkflowLog]:
        return db.query(WorkflowLog).filter(WorkflowLog.workflow_id == workflow_id).order_by(WorkflowLog.created_at.asc()).all()
