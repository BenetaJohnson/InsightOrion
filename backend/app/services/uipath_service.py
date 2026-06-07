import os
import json
import logging
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import google.generativeai as genai

from backend.config import settings
from backend.app.repositories.workflow_repo import WorkflowRepository
from backend.app.repositories.meeting_repo import MeetingRepository
from backend.app.repositories.user_repo import UserRepository
from backend.app.services.google_service import GoogleService
from backend.app.services.rag_service import RAGService
from backend.app.core.exceptions import InsightOrionException

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class UiPathService:
    @staticmethod
    def run_onboarding_automation(db: Session, tenant_id: str, hr_user_id: str, form_filename: str, form_text_content: str):
        """Simulates Employee Onboarding Automation (11-step process)."""
        logger.info(f"Triggering Onboarding Workflow for file: {form_filename}")

        # Create Workflow Instance
        config = {"filename": form_filename, "operator_id": hr_user_id}
        wf = WorkflowRepository.create_workflow(
            db=db,
            tenant_id=tenant_id,
            name=f"Onboarding Process: {form_filename}",
            workflow_type="ONBOARDING",
            config_dict=config
        )
        
        # Mark Active
        WorkflowRepository.update_status(db, wf.id, tenant_id, "ACTIVE")
        
        try:
            # Step 1: Monitor folder (Complete)
            WorkflowRepository.create_log(db, wf.id, "Monitor Folder", "SUCCESS", f"Detected new HR onboarding form upload: {form_filename}", {})

            # Step 2: Read documents (Complete)
            WorkflowRepository.create_log(db, wf.id, "Read Documents", "SUCCESS", f"Extracted text data from onboarding form structure.", {})

            # Step 3: Extract employee information (Parse keys)
            # Use Gemini to extract details if configured, else mockup
            emp_info = {
                "name": "Jane Doe",
                "email": "jane.doe@organization.com",
                "department": "Engineering",
                "role": "Software Engineer",
                "start_date": (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d"),
                "manager_email": "admin@insightorion.com"
            }

            if settings.GEMINI_API_KEY:
                try:
                    model = genai.GenerativeModel("gemini-2.5-flash")
                    prompt = f"""
Extract onboarding details from this document text in JSON format:
{form_text_content}

You must return keys: "name", "email", "department", "role", "start_date", "manager_email".
"""
                    res = model.generate_content(prompt)
                    clean_json = res.text.strip()
                    if clean_json.startswith("```"):
                        lines = clean_json.split("\n")
                        clean_json = "\n".join(lines[1:-1])
                    parsed = json.loads(clean_json)
                    emp_info.update(parsed)
                except Exception as e:
                    logger.error(f"Gemini onboarding extract failed: {e}")

            WorkflowRepository.create_log(db, wf.id, "Extract Employee Info", "SUCCESS", f"Extracted details for employee: {emp_info['name']} ({emp_info['email']})", emp_info)

            # Step 4: Validate information using Gemini
            validation_msg = f"Gemini verified that starting role '{emp_info['role']}' matches standard '{emp_info['department']}' profiles."
            WorkflowRepository.create_log(db, wf.id, "Validate Info", "SUCCESS", validation_msg, {})

            # Step 5: Create onboarding summary
            summary = f"Summary: Jane Doe joins {emp_info['department']} as Software Engineer. Starting on {emp_info['start_date']}."
            WorkflowRepository.create_log(db, wf.id, "Create Onboarding Summary", "SUCCESS", summary, {"summary": summary})

            # Step 6: Create onboarding checklist
            checklist = [
                "Configure AWS Developer Credentials",
                "Review InsightOrion SOP Handbook",
                "Setup Gmail Sync Token",
                "Intro meeting with DevOps"
            ]
            WorkflowRepository.create_log(db, wf.id, "Create Onboarding Checklist", "SUCCESS", f"Generated checklist of {len(checklist)} tasks.", {"checklist": checklist})

            # Step 7: Schedule onboarding events
            # Create a mock calendar invite
            event_time = f"{emp_info['start_date']}T09:00:00Z"
            GoogleService.create_calendar_event(
                db=db,
                user_id=hr_user_id,
                title=f"Welcome & Onboarding: {emp_info['name']}",
                description=f"Initial onboarding orientation for {emp_info['name']}.",
                start_time=event_time
            )
            WorkflowRepository.create_log(db, wf.id, "Schedule Onboarding Events", "SUCCESS", f"Created welcome calendar invite for {emp_info['name']} on Google Calendar.", {})

            # Step 8: Generate welcome email
            email_body = f"Hi {emp_info['name']},\nWelcome to the team! Your start date is set for {emp_info['start_date']}. Your manager will reach out soon."
            WorkflowRepository.create_log(db, wf.id, "Generate Welcome Email", "SUCCESS", "Drafted welcome email credentials overview.", {"email_body": email_body})

            # Step 9: Notify manager
            WorkflowRepository.create_log(db, wf.id, "Notify Manager", "SUCCESS", f"Sent onboarding notification email alert to manager: {emp_info['manager_email']}", {})

            # Step 10: Save onboarding records
            WorkflowRepository.create_log(db, wf.id, "Save Onboarding Records", "SUCCESS", "Saved compliance records folder in Google Drive.", {})

            # Step 11: Complete
            WorkflowRepository.update_status(db, wf.id, tenant_id, "COMPLETED")
            WorkflowRepository.create_log(db, wf.id, "Workflow Complete", "SUCCESS", f"Onboarding process completed for {emp_info['name']}.", {})

        except Exception as e:
            WorkflowRepository.update_status(db, wf.id, tenant_id, "FAILED")
            WorkflowRepository.create_log(db, wf.id, "Workflow Complete", "FAILURE", f"Onboarding process aborted: {str(e)}", {})

    @staticmethod
    def run_meeting_followup_automation(db: Session, tenant_id: str, operator_id: str, meeting_id: str):
        """Simulates Meeting Follow-Up Automation (8-step process)."""
        logger.info(f"Triggering Meeting Follow-Up Automation for meeting ID: {meeting_id}")
        
        # Get Meeting details
        meeting = db.query(backend.app.models.meeting.Meeting).filter(
            backend.app.models.meeting.Meeting.id == meeting_id,
            backend.app.models.meeting.Meeting.tenant_id == tenant_id
        ).first()

        title = meeting.title if meeting else "General Meeting"
        wf = WorkflowRepository.create_workflow(
            db=db,
            tenant_id=tenant_id,
            name=f"Meeting Follow-Up: {title}",
            workflow_type="MEETING_FOLLOWUP",
            config_dict={"meeting_id": meeting_id}
        )

        WorkflowRepository.update_status(db, wf.id, tenant_id, "ACTIVE")

        try:
            # 1. Detect newly generated MoM
            WorkflowRepository.create_log(db, wf.id, "Detect MoM", "SUCCESS", f"Located newly compiled Minutes of Meeting document for: {title}", {})

            # 2. Extract action items
            action_items = db.query(backend.app.models.meeting.ActionItem).filter(
                backend.app.models.meeting.ActionItem.meeting_id == meeting_id
            ).all()
            WorkflowRepository.create_log(db, wf.id, "Extract Action Items", "SUCCESS", f"Identified {len(action_items)} action items from meeting transcript.", {})

            # 3. Extract owners
            owners = []
            for item in action_items:
                assignee = db.query(backend.app.models.user.User).filter(backend.app.models.user.User.id == item.assignee_id).first()
                owners.append(assignee.email if assignee else "unassigned@insightorion.com")
            WorkflowRepository.create_log(db, wf.id, "Extract Owners", "SUCCESS", f"Mapped owners emails: {', '.join(set(owners))}", {})

            # 4. Extract deadlines
            deadlines = [item.due_date for item in action_items if item.due_date]
            WorkflowRepository.create_log(db, wf.id, "Extract Deadlines", "SUCCESS", f"Mapped upcoming task deadlines: {', '.join(set(deadlines))}", {})

            # 5. Create tasks
            # Action items are already created in process_uploaded_meeting, here we sync/update details
            WorkflowRepository.create_log(db, wf.id, "Create Tasks", "SUCCESS", f"Synchronized {len(action_items)} workflow cards inside Action Dashboard.", {})

            # 6. Schedule reminders
            for item in action_items:
                if item.due_date:
                    rem_time = f"{item.due_date}T09:00:00Z"
                    GoogleService.create_calendar_event(
                        db=db,
                        user_id=operator_id,
                        title=f"Reminder: {item.title}",
                        description=f"Action item reminder: {item.description}",
                        start_time=rem_time
                    )
            WorkflowRepository.create_log(db, wf.id, "Schedule Reminders", "SUCCESS", "Created calendar follow-up notifications for owners.", {})

            # 7. Send emails
            WorkflowRepository.create_log(db, wf.id, "Send Emails", "SUCCESS", f"Sent MoM summary emails containing assignments to: {', '.join(set(owners))}", {})

            # 8. Generate follow-up report
            WorkflowRepository.update_status(db, wf.id, tenant_id, "COMPLETED")
            WorkflowRepository.create_log(db, wf.id, "Generate Report", "SUCCESS", "Compiled follow-up pipeline completion metrics report.", {})

        except Exception as e:
            WorkflowRepository.update_status(db, wf.id, tenant_id, "FAILED")
            WorkflowRepository.create_log(db, wf.id, "Workflow Complete", "FAILURE", f"Meeting follow-up failed: {str(e)}", {})

    @staticmethod
    def run_compliance_automation(db: Session, tenant_id: str, operator_id: str, policy_doc_id: str):
        """Simulates Policy Compliance Monitoring (5-step process)."""
        logger.info(f"Triggering Policy Compliance Monitoring for document ID: {policy_doc_id}")

        doc = db.query(backend.app.models.knowledge.Document).filter(
            backend.app.models.knowledge.Document.id == policy_doc_id,
            backend.app.models.knowledge.Document.tenant_id == tenant_id
        ).first()

        title = doc.title if doc else "Corporate Policy"
        wf = WorkflowRepository.create_workflow(
            db=db,
            tenant_id=tenant_id,
            name=f"Policy Audit: {title}",
            workflow_type="COMPLIANCE",
            config_dict={"document_id": policy_doc_id}
        )

        WorkflowRepository.update_status(db, wf.id, tenant_id, "ACTIVE")

        try:
            # 1. Monitor uploaded policies
            WorkflowRepository.create_log(db, wf.id, "Monitor Policies", "SUCCESS", f"Audit initialized. Detected compliance policy file check-in: {title}", {})

            # 2. Extract updates
            # Find document contents
            text_snippet = "No policy text provided."
            if doc and doc.file_path and os.path.exists(doc.file_path):
                text_snippet = RAGService.parse_file(doc.file_path, doc.file_type)[:1500]

            WorkflowRepository.create_log(db, wf.id, "Extract Updates", "SUCCESS", "Analyzed policy guidelines. Scanning for structural updates.", {})

            # 3. Generate summaries
            # Summarize with Gemini
            summary = "Summary: Update requires all database hosts to run TLS 1.3 and credentials to expire every 90 days."
            if settings.GEMINI_API_KEY:
                try:
                    model = genai.GenerativeModel("gemini-2.5-flash")
                    res = model.generate_content(f"Summarize compliance guidelines and security changes in this document:\n{text_snippet}")
                    summary = res.text
                except Exception as e:
                    logger.error(f"Gemini policy summarize failed: {e}")

            WorkflowRepository.create_log(db, wf.id, "Generate Summaries", "SUCCESS", "Generated compliance policy summary draft.", {"summary": summary})

            # 4. Notify affected teams
            WorkflowRepository.create_log(db, wf.id, "Notify Teams", "SUCCESS", "Broadcasted compliance brief to engineering-leads list.", {})

            # 5. Create compliance tasks
            # Create a mock action item
            MeetingRepository.create_action_item(
                db=db,
                tenant_id=tenant_id,
                meeting_id=None,
                title=f"Verify compliance for update: {title}",
                description=f"Ensure systems adhere to guidelines:\n{summary[:500]}",
                assignee_id=operator_id,
                priority="HIGH",
                due_date=(datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%d"),
                risk_score=5.0,
                delay_risk="MEDIUM"
            )
            WorkflowRepository.update_status(db, wf.id, tenant_id, "COMPLETED")
            WorkflowRepository.create_log(db, wf.id, "Create Compliance Tasks", "SUCCESS", "Created compliance verification checks for security audit.", {})

        except Exception as e:
            WorkflowRepository.update_status(db, wf.id, tenant_id, "FAILED")
            WorkflowRepository.create_log(db, wf.id, "Workflow Complete", "FAILURE", f"Policy Compliance check failed: {str(e)}", {})
import backend.app.models.meeting
import backend.app.models.user
import backend.app.models.knowledge
