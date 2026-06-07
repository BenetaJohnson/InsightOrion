import os
import json
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
import google.generativeai as genai

from backend.config import settings
from backend.app.repositories.jira_repo import JiraRepository
from backend.app.repositories.memory_repo import MemoryRepository
from backend.app.repositories.user_repo import UserRepository
from backend.app.repositories.knowledge_repo import KnowledgeRepository
from backend.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class JiraService:
    @staticmethod
    def sync_jira_tickets(db: Session, tenant_id: str) -> int:
        """Syncs Jira tickets. If API settings are missing, triggers rich mock sandbox sync."""
        logger.info("Executing Jira tickets sync...")
        sync_count = 0
        
        # 1. Resolve default admin user to assign mock tickets
        admin_user = db.query(backend.app.models.user.User).filter(
            backend.app.models.user.User.role == "ORG_ADMIN",
            backend.app.models.user.User.tenant_id == tenant_id
        ).first()
        admin_id = admin_user.id if admin_user else None

        # Build a list of mock engineering tickets (bugs, stories)
        # Includes OAuth, Redis, Kafka, Docker issues to fit the Copilot questions
        mock_tickets = [
            {
                "key": "ENG-401",
                "project_key": "ENG",
                "title": "Fix OAuth session token cookie validation leak",
                "description": "Session token is not correctly persisting in local cookies. Users are logged out on every hot reload. Need standard cookie authentication setup.",
                "status": "RESOLVED",
                "priority": "HIGH",
                "sprint_name": "Sprint 3",
                "assignee_email": "admin@insightorion.com",
                "resolved": True,
                "resolution": {
                    "problem": "OAuth cookies are configured without SameSite=Lax and secure parameters, causing browser dropouts.",
                    "root_cause": "The backend CORS origin headers were missing credentials allowances, dropping auth claims.",
                    "solution": "Added credentials=True middleware and updated cookie headers with secure=True flags."
                }
            },
            {
                "key": "ENG-402",
                "project_key": "ENG",
                "title": "Optimize Redis connection pool leakage on compute nodes",
                "description": "Redis client is dropping connections, leaking file descriptors. System experiences out of memory errors under load.",
                "status": "RESOLVED",
                "priority": "BLOCKER",
                "sprint_name": "Sprint 3",
                "assignee_email": "admin@insightorion.com",
                "resolved": True,
                "resolution": {
                    "problem": "Redis connection pool allocations were initialized per-request instead of a shared global context.",
                    "root_cause": "Request session middleware lacked global connection caching.",
                    "solution": "Refactored Redis connections to a startup lifespan dependency pool."
                }
            },
            {
                "key": "ENG-403",
                "project_key": "ENG",
                "title": "Configure Kafka event logs streaming partitions",
                "description": "Kafka consumer partitions are not evenly balanced. Some telemetry files index logs are dropping during sprint load.",
                "status": "RESOLVED",
                "priority": "MEDIUM",
                "sprint_name": "Sprint 2",
                "assignee_email": "admin@insightorion.com",
                "resolved": True,
                "resolution": {
                    "problem": "Kafka stream partition key was unconfigured, routing all packets to partition 0.",
                    "root_cause": "Key hashing was missing in producer configurations.",
                    "solution": "Added tenant-id hash hashing partitioner keys to balance workload consumer channels."
                }
            },
            {
                "key": "ENG-404",
                "project_key": "ENG",
                "title": "Database index optimization search query latencies",
                "description": "SQL query searches are taking over 500ms on index tables. Need compound indexes.",
                "status": "IN_PROGRESS",
                "priority": "HIGH",
                "sprint_name": "Sprint 4",
                "assignee_email": "admin@insightorion.com",
                "resolved": False
            }
        ]

        for t in mock_tickets:
            # Sync user email
            user_res = db.query(backend.app.models.user.User).filter(
                backend.app.models.user.User.email == t["assignee_email"],
                backend.app.models.user.User.tenant_id == tenant_id
            ).first()
            user_id = user_res.id if user_res else admin_id

            # Save/Update ticket
            ticket = JiraRepository.create_ticket(
                db=db,
                tenant_id=tenant_id,
                key=t["key"],
                project_key=t["project_key"],
                title=t["title"],
                description=t["description"],
                status=t["status"],
                priority=t["priority"],
                assignee_id=user_id,
                reporter_id=admin_id,
                sprint_name=t["sprint_name"]
            )
            
            # Index ticket description in FAISS
            doc_title = f"Jira Ticket: {t['key']} - {t['title']}"
            doc = KnowledgeRepository.create(
                db=db,
                tenant_id=tenant_id,
                title=doc_title,
                file_path=None,
                file_type="TXT",
                source_type="JIRA",
                size_bytes=len(t["description"]),
                metadata_dict={"ticket_key": t["key"]},
                content_hash=f"jira_{t['key']}"
            )
            
            index_text = f"Jira Ticket Key: {t['key']}\nTitle: {t['title']}\nDescription: {t['description']}\nStatus: {t['status']}"
            RAGService.index_document(db, tenant_id, doc.id, index_text, doc_title, "JIRA")

            # Save resolved memory records
            if t["resolved"] and "resolution" in t:
                # Check duplicate
                existing_mem = db.query(backend.app.models.memory.ResolvedIssue).filter(
                    backend.app.models.memory.ResolvedIssue.ticket_id == ticket.id
                ).first()
                
                if not existing_mem:
                    sol = t["resolution"]
                    memory = MemoryRepository.register_resolution(
                        db=db,
                        tenant_id=tenant_id,
                        ticket_id=ticket.id,
                        problem_description=sol["problem"],
                        root_cause=sol["root_cause"],
                        solution_details=sol["solution"],
                        expert_id=user_id
                    )

                    # Index resolved memory in RAG
                    mem_title = f"Resolved Incident Memory: {t['key']}"
                    mem_doc = KnowledgeRepository.create(
                        db=db,
                        tenant_id=tenant_id,
                        title=mem_title,
                        file_path=None,
                        file_type="TXT",
                        source_type="RESOLVED_ISSUE",
                        size_bytes=len(sol["solution"]),
                        metadata_dict={"resolved_issue_id": memory.id},
                        content_hash=f"mem_{t['key']}"
                    )
                    
                    mem_index_text = f"Resolved Problem: {sol['problem']}\nRoot Cause: {sol['root_cause']}\nSolution: {sol['solution']}\nExpert Engineer: {t['assignee_email']}"
                    RAGService.index_document(db, tenant_id, mem_doc.id, mem_index_text, mem_title, "RESOLVED_ISSUE")

            sync_count += 1
            
        return sync_count

    @staticmethod
    def detect_similar_issues(tenant_id: str, query_text: str) -> List[Dict]:
        """Queries RAG index for matching tickets or resolved issue memories."""
        results = RAGService.search_vector_store(tenant_id, query_text, limit=3)
        # Filter matching source types
        filtered = [r for r in results if r["source_type"] in ["JIRA", "RESOLVED_ISSUE"]]
        return filtered

    @staticmethod
    def expert_finder(db: Session, tenant_id: str, query_skill: str) -> List[Dict]:
        """Finds engineers with history resolving issues in matching topics."""
        similar = JiraService.detect_similar_issues(tenant_id, query_skill)
        experts = {}
        
        for sim in similar:
            doc_id = sim["doc_id"]
            # Look up source document to fetch metadata
            doc = db.query(backend.app.models.knowledge.Document).filter(
                backend.app.models.knowledge.Document.id == doc_id
            ).first()
            if not doc:
                continue

            meta = json.loads(doc.metadata_json) if doc.metadata_json else {}
            ticket_key = meta.get("ticket_key")
            resolved_issue_id = meta.get("resolved_issue_id")

            expert_user = None
            if ticket_key:
                ticket = db.query(backend.app.models.jira.JiraTicket).filter(
                    backend.app.models.jira.JiraTicket.key == ticket_key,
                    backend.app.models.jira.JiraTicket.tenant_id == tenant_id
                ).first()
                if ticket and ticket.assignee_id:
                    expert_user = db.query(backend.app.models.user.User).filter(
                        backend.app.models.user.User.id == ticket.assignee_id
                    ).first()
            elif resolved_issue_id:
                res = db.query(backend.app.models.memory.ResolvedIssue).filter(
                    backend.app.models.memory.ResolvedIssue.id == resolved_issue_id,
                    backend.app.models.memory.ResolvedIssue.tenant_id == tenant_id
                ).first()
                if res and res.expert_id:
                    expert_user = db.query(backend.app.models.user.User).filter(
                        backend.app.models.user.User.id == res.expert_id
                    ).first()

            if expert_user:
                email = expert_user.email
                if email not in experts:
                    experts[email] = {
                        "name": expert_user.full_name,
                        "email": email,
                        "resolved_count": 0,
                        "recent_ticket": ticket_key or "Incident DB"
                    }
                experts[email]["resolved_count"] += 1

        return list(experts.values())

    @staticmethod
    def suggest_root_cause_and_recs(db: Session, tenant_id: str, ticket_key: str) -> Dict:
        """Asks Gemini to suggest root cause and resolution plans based on RAG similarities."""
        ticket = db.query(backend.app.models.jira.JiraTicket).filter(
            backend.app.models.jira.JiraTicket.key == ticket_key,
            backend.app.models.jira.JiraTicket.tenant_id == tenant_id
        ).first()
        
        if not ticket:
            return {"error": "Ticket not found"}

        # Perform semantic lookup for similar incidents in memory
        similar_mems = JiraService.detect_similar_issues(tenant_id, f"{ticket.title} {ticket.description}")
        context_str = ""
        for idx, sim in enumerate(similar_mems):
            context_str += f"Similar Memory Case {idx + 1}:\n{sim['content']}\n\n"

        prompt = f"""
You are the Engineering Intelligence Copilot.
Given this target Jira issue and history database of resolved incident memories, analyze and suggest:
1. Potential root causes
2. Step-by-step resolution recommendations

Target Ticket:
Key: {ticket.key}
Title: {ticket.title}
Description: {ticket.description}

Resolved memories found:
{context_str}

Format your response in professional Markdown. Be concise and actionable.
"""
        recs = ""
        if settings.GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(prompt)
                recs = response.text
            except Exception as e:
                recs = f"Gemini recommendation failed: {str(e)}"
        else:
            recs = (
                f"### Root Cause Suggestion (Sandbox Mode)\n"
                f"Based on similar incident files regarding **ENG-402 (Redis Pool leaks)**, "
                f"this issue is likely caused by unclosed sockets inside database middleware loop handles.\n\n"
                f"### Recommendations:\n"
                f"1. Refactor socket initialization into globally cached dependencies.\n"
                f"2. Ensure pool size limits are restricted."
            )

        return {
            "ticket_key": ticket.key,
            "title": ticket.title,
            "analysis": recs
        }
import backend.app.models.user
import backend.app.models.knowledge
import backend.app.models.jira
import backend.app.models.memory
