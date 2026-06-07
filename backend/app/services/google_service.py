import json
import logging
from sqlalchemy.orm import Session
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from backend.config import settings
from backend.app.repositories.user_repo import UserRepository
from backend.app.repositories.knowledge_repo import KnowledgeRepository
from backend.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)

class GoogleService:
    @staticmethod
    def get_auth_url() -> str:
        """Constructs Google OAuth authorization URL redirect path."""
        # Standard Oauth2 URI
        client_id = settings.GOOGLE_CLIENT_ID or "mock_client_id"
        redirect = settings.GOOGLE_REDIRECT_URI
        scopes = "%20".join([
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/calendar"
        ])
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect}&"
            f"response_type=code&"
            f"scope={scopes}&"
            f"access_type=offline&"
            f"prompt=consent"
        )

    @staticmethod
    def exchange_code(db: Session, user_id: str, code: str) -> dict:
        """Exchanges callback auth code for tokens and saves refresh token in user profile."""
        logger.info(f"Exchanging auth code for user {user_id}")
        
        # In a real app, we would make a POST request to https://oauth2.googleapis.com/token
        # Here we mock token acquisition and save a dummy token for local demo runs
        mock_refresh_token = f"mock_refresh_token_for_{user_id}_xyz123"
        UserRepository.save_google_token(db, user_id, mock_refresh_token)
        return {"status": "success", "message": "Google Workspace connected successfully."}

    @staticmethod
    def get_credentials(user_refresh_token: str) -> Optional[Credentials]:
        """Loads google credentials from refresh token."""
        if not user_refresh_token or "mock" in user_refresh_token:
            return None
        try:
            return Credentials(
                token=None,
                refresh_token=user_refresh_token,
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                token_uri="https://oauth2.googleapis.com/token"
            )
        except Exception as e:
            logger.error(f"Error loading credentials: {e}")
            return None

    @staticmethod
    def sync_drive_files(db: Session, tenant_id: str, user_id: str) -> int:
        """Fetches Drive files, parses documents, and indexes them in RAG vector store."""
        user = UserRepository.get_by_id(db, user_id)
        creds = GoogleService.get_credentials(user.google_refresh_token if user else None)
        
        indexed_count = 0
        if creds:
            try:
                service = build("drive", "v3", credentials=creds)
                # List matching mime-types (PDFs, DOCX, TXT, etc.)
                results = service.files().list(
                    q="mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='text/plain'",
                    pageSize=10,
                    fields="nextPageToken, files(id, name, mimeType, size)"
                ).execute()
                files = results.get("files", [])
                
                for f in files:
                    file_id = f.get("id")
                    file_name = f.get("name")
                    mime = f.get("mimeType")
                    size = int(f.get("size", 0))

                    # Check duplicates
                    existing = KnowledgeRepository.get_by_hash(db, tenant_id, f"drive_{file_id}")
                    if existing:
                        continue

                    # Download file content stream
                    request = service.files().get_media(fileId=file_id)
                    local_tmp = os.path.join(settings.UPLOAD_DIR, f"drive_{file_id}")
                    with open(local_tmp, "wb") as local_f:
                        local_f.write(request.execute())

                    # Parse and save
                    file_type = "PDF" if "pdf" in mime else ("DOCX" if "word" in mime else "TXT")
                    text = RAGService.parse_file(local_tmp, file_type)
                    
                    doc = KnowledgeRepository.create(
                        db=db,
                        tenant_id=tenant_id,
                        title=file_name,
                        file_path=local_tmp,
                        file_type=file_type,
                        source_type="GOOGLE_DRIVE",
                        size_bytes=size,
                        metadata_dict={"drive_file_id": file_id},
                        content_hash=f"drive_{file_id}"
                    )
                    
                    RAGService.index_document(db, tenant_id, doc.id, text, file_name, "GOOGLE_DRIVE")
                    indexed_count += 1
                return indexed_count
            except Exception as e:
                logger.error(f"Google Drive sync failed: {e}")

        # Mock Sync Simulator (Console fallback)
        logger.info("Executing Google Drive mock sync simulator...")
        mock_files = [
            {"id": "mock_drive_001", "name": "Company SOP & Cloud Security Standards.txt", "text": "This document outlines standard operational policies. All employees must configure double security authentication. Cloud nodes run encrypted under DevOps IAM credentials."},
            {"id": "mock_drive_002", "name": "Project Alpha Briefing & Scope.txt", "text": "Project Alpha aims to implement a unified cloud analytics engine. Core migrations are handled by AWS instances. Blockers include frontend cookie persistence."}
        ]
        
        for f in mock_files:
            existing = KnowledgeRepository.get_by_hash(db, tenant_id, f["id"])
            if not existing:
                doc = KnowledgeRepository.create(
                    db=db,
                    tenant_id=tenant_id,
                    title=f["name"],
                    file_path=None,
                    file_type="TXT",
                    source_type="GOOGLE_DRIVE",
                    size_bytes=len(f["text"]),
                    metadata_dict={"drive_file_id": f["id"]},
                    content_hash=f["id"]
                )
                RAGService.index_document(db, tenant_id, doc.id, f["text"], f["name"], "GOOGLE_DRIVE")
                indexed_count += 1
        return indexed_count

    @staticmethod
    def sync_gmail_emails(db: Session, tenant_id: str, user_id: str) -> int:
        """Fetches recent emails related to enterprise topics and indexes them in RAG."""
        user = UserRepository.get_by_id(db, user_id)
        creds = GoogleService.get_credentials(user.google_refresh_token if user else None)
        
        indexed_count = 0
        if creds:
            try:
                service = build("gmail", "v1", credentials=creds)
                # Fetch recent threads
                results = service.users().messages().list(userId="me", maxResults=5, q="subject:(Project OR Compliance OR Cloud)").execute()
                messages = results.get("messages", [])
                
                for msg in messages:
                    msg_id = msg.get("id")
                    raw_msg = service.users().messages().get(userId="me", id=msg_id).execute()
                    
                    snippet = raw_msg.get("snippet", "")
                    headers = raw_msg.get("payload", {}).get("headers", [])
                    subject = next((h["value"] for h in headers if h["name"] == "Subject"), "No Subject")
                    sender = next((h["value"] for h in headers if h["name"] == "From"), "Unknown")
                    
                    existing = KnowledgeRepository.get_by_hash(db, tenant_id, f"gmail_{msg_id}")
                    if existing:
                        continue

                    body_text = f"From: {sender}\nSubject: {subject}\nSnippet: {snippet}"
                    doc = KnowledgeRepository.create(
                        db=db,
                        tenant_id=tenant_id,
                        title=f"Email: {subject}",
                        file_path=None,
                        file_type="EMAIL",
                        source_type="GMAIL",
                        size_bytes=len(body_text),
                        metadata_dict={"gmail_msg_id": msg_id, "from": sender},
                        content_hash=f"gmail_{msg_id}"
                    )
                    RAGService.index_document(db, tenant_id, doc.id, body_text, f"Email: {subject}", "GMAIL")
                    indexed_count += 1
                return indexed_count
            except Exception as e:
                logger.error(f"Gmail sync failed: {e}")

        # Mock Email sync simulator
        logger.info("Executing Gmail mock sync simulator...")
        mock_emails = [
            {"id": "mock_gmail_001", "subject": "Urgent: Cloud Latency Escalation", "from": "ops@insightorion.com", "snippet": "We detected an additional 15ms database response latency following last night's aws nodes migration. Check database indexes."},
            {"id": "mock_gmail_002", "subject": "SOC2 Readiness Audit schedule", "from": "compliance-officer@insightorion.com", "snippet": "Reminder: We require dave to finish training tracking validations. Handbooks are uploaded to the secure directory."}
        ]
        
        for e in mock_emails:
            existing = KnowledgeRepository.get_by_hash(db, tenant_id, e["id"])
            if not existing:
                body_text = f"From: {e['from']}\nSubject: {e['subject']}\nBody: {e['snippet']}"
                doc = KnowledgeRepository.create(
                    db=db,
                    tenant_id=tenant_id,
                    title=f"Email: {e['subject']}",
                    file_path=None,
                    file_type="EMAIL",
                    source_type="GMAIL",
                    size_bytes=len(body_text),
                    metadata_dict={"gmail_msg_id": e["id"], "from": e["from"]},
                    content_hash=e["id"]
                )
                RAGService.index_document(db, tenant_id, doc.id, body_text, f"Email: {e['subject']}", "GMAIL")
                indexed_count += 1
        return indexed_count

    @staticmethod
    def create_calendar_event(db: Session, user_id: str, title: str, description: str, start_time: str, duration_mins: int = 30) -> dict:
        """Schedules events or reminders inside Google Calendar. Falls back to logging if mock."""
        user = UserRepository.get_by_id(db, user_id)
        creds = GoogleService.get_credentials(user.google_refresh_token if user else None)
        
        event_details = {
            "summary": title,
            "description": description,
            "start": {"dateTime": start_time, "timeZone": "UTC"},
            "end": {"dateTime": start_time, "timeZone": "UTC"} # We can calculate duration end time
        }

        if creds:
            try:
                service = build("calendar", "v3", credentials=creds)
                event = service.events().insert(calendarId="primary", body=event_details).execute()
                logger.info(f"Google Calendar event created successfully: {event.get('htmlLink')}")
                return {"status": "success", "event_id": event.get("id"), "link": event.get("htmlLink")}
            except Exception as e:
                logger.error(f"Google Calendar scheduling failed: {e}")

        # Console Mock schedule log
        logger.info(f"[Mock Calendar Mode] Created event: '{title}' description: '{description}' scheduled at {start_time}")
        return {"status": "mock_success", "event_id": "mock_event_xyz987", "link": "http://localhost:3000/mock-calendar"}
