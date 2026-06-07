import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from backend.config import settings
from backend.app.core.database import get_db
from backend.app.repositories.knowledge_repo import KnowledgeRepository
from backend.app.services.rag_service import RAGService
from backend.app.services.google_service import GoogleService
from backend.app.routers.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/knowledge", tags=["Knowledge Hub (RAG)"])

class DocumentResponse(BaseModel):
    id: str
    title: str
    file_type: str
    source_type: str
    size_bytes: int
    created_at: str

    model_config = ConfigDict(from_attributes=True)

@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Determine type
    filename = file.filename
    ext = os.path.splitext(filename)[1].replace(".", "").upper()
    if ext not in ["PDF", "DOCX", "PPTX", "TXT", "MD"]:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")

    # Write to local file directory
    local_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.tenant_id}_{filename}")
    try:
        with open(local_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file to disk: {str(e)}")

    try:
        # Parse content text
        text = RAGService.parse_file(local_path, ext)
        
        # Save document metadata in database
        doc = KnowledgeRepository.create(
            db=db,
            tenant_id=current_user.tenant_id,
            title=title,
            file_path=local_path,
            file_type=ext,
            source_type="UPLOAD",
            size_bytes=os.path.getsize(local_path),
            metadata_dict={"uploaded_by": current_user.email}
        )

        # Run privacy redaction scan before indexing
        from backend.app.services.privacy_service import PrivacyService
        text = PrivacyService.sanitize(db, current_user.tenant_id, doc.id, text)

        # Index in FAISS Vector Store
        RAGService.index_document(
            db=db,
            tenant_id=current_user.tenant_id,
            doc_id=doc.id,
            text=text,
            title=title,
            source_type="UPLOAD"
        )

        return {
            "message": "Document uploaded and indexed successfully.",
            "document_id": doc.id,
            "title": doc.title,
            "chunks_count": len(RAGService.chunk_text(text))
        }

    except Exception as e:
        if os.path.exists(local_path):
            os.remove(local_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
def semantic_search(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # 1. Query FAISS index
        chunks = RAGService.search_vector_store(current_user.tenant_id, q, limit=4)
        
        # 2. Call Gemini to answer based on results
        answer_payload = RAGService.generate_answer(current_user.tenant_id, q, chunks)
        return answer_payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync/google")
def sync_google_workspace(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        drive_count = GoogleService.sync_drive_files(db, current_user.tenant_id, current_user.id)
        gmail_count = GoogleService.sync_gmail_emails(db, current_user.tenant_id, current_user.id)
        return {
            "message": "Google Workspace sync operation completed.",
            "drive_files_indexed": drive_count,
            "gmail_emails_indexed": gmail_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
def get_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    docs = KnowledgeRepository.list_by_tenant(db, current_user.tenant_id)
    result = []
    for d in docs:
        result.append({
            "id": d.id,
            "title": d.title,
            "file_type": d.file_type,
            "source_type": d.source_type,
            "size_bytes": d.size_bytes,
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return result

@router.delete("/documents/{id}")
def delete_document(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Delete metadata from DB
    doc = KnowledgeRepository.get_by_id(db, id, current_user.tenant_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Remove physical file if uploaded
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    deleted = KnowledgeRepository.delete(db, id, current_user.tenant_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete document from database.")

    # Re-indexing FAISS is normally scheduled in production. For MVP, we alert successful DB deletion.
    return {"message": "Document metadata removed from Knowledge Hub."}
