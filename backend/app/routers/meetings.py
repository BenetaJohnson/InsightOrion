import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.config import settings
from backend.app.core.database import get_db
from backend.app.repositories.meeting_repo import MeetingRepository
from backend.app.services.meeting_service import MeetingService
from backend.app.services.export_service import ExportService
from backend.app.routers.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/meetings", tags=["Meeting Intelligence"])

class MeetingListResponse(BaseModel):
    id: str
    title: str
    date: str
    duration_seconds: int
    status: str
    created_at: str

@router.post("/upload")
def upload_meeting(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    date: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify extension
    ext = os.path.splitext(file.filename)[1].replace(".", "").upper()
    if ext not in ["MP3", "WAV", "MP4", "M4A"]:
        raise HTTPException(status_code=400, detail="Unsupported media format. Use MP3, WAV, MP4, or M4A.")

    # Save media file
    local_path = os.path.join(settings.UPLOAD_DIR, f"meeting_{current_user.tenant_id}_{file.filename}")
    try:
        with open(local_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save audio file: {str(e)}")

    # Create DB record in PENDING state
    meeting = MeetingRepository.create_meeting(
        db=db,
        tenant_id=current_user.tenant_id,
        title=title,
        date=date,
        duration_seconds=0,  # Updated after processing
        video_audio_path=local_path
    )

    # Trigger async processing in FastAPI background thread
    background_tasks.add_task(
        MeetingService.process_uploaded_meeting,
        db=db,
        tenant_id=current_user.tenant_id,
        meeting_id=meeting.id,
        file_path=local_path
    )

    return {
        "message": "Meeting file uploaded successfully. Processing transcript and MoM in background.",
        "meeting_id": meeting.id,
        "title": meeting.title,
        "status": "PENDING"
    }

@router.get("/list")
def list_meetings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meetings = MeetingRepository.list_by_tenant(db, current_user.tenant_id)
    result = []
    for m in meetings:
        result.append({
            "id": m.id,
            "title": m.title,
            "date": m.date,
            "duration_seconds": m.duration_seconds,
            "status": m.status,
            "created_at": m.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return result

@router.get("/{id}")
def get_meeting_details(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meeting = MeetingRepository.get_by_id(db, id, current_user.tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    
    # Parse JSON properties safely
    speaker_segments = []
    mom_data = {}
    try:
        if meeting.speaker_segments_json:
            speaker_segments = json.loads(meeting.speaker_segments_json)
        if meeting.mom_json:
            mom_data = json.loads(meeting.mom_json)
    except Exception:
        pass

    return {
        "id": meeting.id,
        "title": meeting.title,
        "date": meeting.date,
        "duration_seconds": meeting.duration_seconds,
        "status": meeting.status,
        "transcript": meeting.transcript_text,
        "speaker_segments": speaker_segments,
        "mom": mom_data,
        "created_at": meeting.created_at
    }

@router.post("/{id}/mom/regenerate")
def regenerate_mom(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meeting = MeetingRepository.get_by_id(db, id, current_user.tenant_id)
    if not meeting or not meeting.transcript_text:
        raise HTTPException(status_code=400, detail="Cannot regenerate MoM: Transcript not ready.")

    mom_data = MeetingService.generate_mom(meeting.transcript_text, meeting.title, meeting.date)
    meeting.mom_json = json.dumps(mom_data)
    db.commit()
    return {"message": "MoM regenerated successfully.", "mom": mom_data}

@router.get("/{id}/export")
def export_mom(id: str, format: str = "md", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meeting = MeetingRepository.get_by_id(db, id, current_user.tenant_id)
    if not meeting or not meeting.mom_json:
        raise HTTPException(status_code=404, detail="Meeting MoM data not available.")
    
    try:
        mom_data = json.loads(meeting.mom_json)
    except Exception:
        raise HTTPException(status_code=500, detail="Invalid MoM formatting in database.")

    format = format.lower()
    if format == "md":
        content = ExportService.to_markdown(mom_data)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=mom_{id}.md"}
        )
    elif format == "html" or format == "pdf":
        # Returns HTML format directly. User can print/save as PDF via browser.
        content = ExportService.to_html(mom_data)
        return Response(
            content=content,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename=mom_{id}.html"}
        )
    elif format == "docx":
        docx_stream = ExportService.to_docx(mom_data)
        return StreamingResponse(
            docx_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename=mom_{id}.docx"}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format. Use md, html, or docx.")
