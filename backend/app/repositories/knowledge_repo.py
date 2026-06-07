import json
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.models.knowledge import Document

class KnowledgeRepository:
    @staticmethod
    def get_by_id(db: Session, doc_id: str, tenant_id: str) -> Optional[Document]:
        return db.query(Document).filter(
            Document.id == doc_id,
            Document.tenant_id == tenant_id
        ).first()

    @staticmethod
    def get_by_hash(db: Session, tenant_id: str, content_hash: str) -> Optional[Document]:
        return db.query(Document).filter(
            Document.tenant_id == tenant_id,
            Document.content_hash == content_hash
        ).first()

    @staticmethod
    def create(
        db: Session,
        tenant_id: str,
        title: str,
        file_path: Optional[str],
        file_type: str,
        source_type: str,
        size_bytes: int,
        metadata_dict: dict,
        content_hash: Optional[str] = None
    ) -> Document:
        db_doc = Document(
            tenant_id=tenant_id,
            title=title,
            file_path=file_path,
            file_type=file_type,
            source_type=source_type,
            size_bytes=size_bytes,
            metadata_json=json.dumps(metadata_dict),
            content_hash=content_hash
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        return db_doc

    @staticmethod
    def list_by_tenant(db: Session, tenant_id: str) -> List[Document]:
        return db.query(Document).filter(Document.tenant_id == tenant_id).order_by(Document.created_at.desc()).all()

    @staticmethod
    def delete(db: Session, doc_id: str, tenant_id: str) -> bool:
        db_doc = KnowledgeRepository.get_by_id(db, doc_id, tenant_id)
        if db_doc:
            db.delete(db_doc)
            db.commit()
            return True
        return False
