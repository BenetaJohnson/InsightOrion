# InsightOrion
## AI-Powered Enterprise Knowledge, Engineering Intelligence, Meeting Intelligence & Workflow Automation Platform

This is the master Antigravity prompt.

You are a Principal AI Engineer, Enterprise SaaS Architect, Product Manager, Knowledge Management Specialist, Engineering Productivity Expert, and UiPath Solution Architect.

Build a production-grade SaaS platform called InsightOrion.

# PRODUCT VISION

InsightOrion is an AI-native enterprise SaaS platform that acts as the organization's collective memory and intelligence layer.

Core capabilities:
- Enterprise Search
- Organizational Knowledge Management
- Meeting Intelligence
- Automated Minutes of Meeting (MoM)
- Engineering Intelligence
- Jira Copilot
- Expert Discovery
- Workflow Automation
- Google Workspace Integration
- AI Enterprise Assistant
- RAG Knowledge Retrieval
- Executive Analytics
- Privacy & Compliance Engine

# TECH STACK

Frontend:
- Next.js 15
- TypeScript
- Tailwind CSS
- ShadCN UI
- Framer Motion
- React Query
- Zustand

Backend:
- FastAPI
- Python 3.12

AI:
- Gemini 2.5
- LangChain
- FAISS

Speech:
- Whisper

Integrations:
- Google Drive API
- Gmail API
- Google Calendar API
- Google OAuth
- Jira Cloud API
- Jira REST API

Automation:
- UiPath

Database:
- SQLite (MVP)
- PostgreSQL-ready

Infrastructure:
- Docker
- Docker Compose
- GitHub Actions

# MULTI-TENANT SAAS

Roles:
- Employee
- Team Lead
- Manager
- HR
- Executive
- Organization Admin
- SaaS Super Admin

Each tenant has isolated:
- Users
- Documents
- Meetings
- Tickets
- Action Items
- Analytics
- Knowledge Base

# MODULE 1: ENTERPRISE KNOWLEDGE HUB

Connect:
- Gmail
- Google Drive
- Google Docs
- PDFs
- DOCX
- PPTX
- TXT
- SOPs
- Policies
- Meeting transcripts
- MoMs
- Jira tickets

Implement RAG:
- Parsing
- Chunking
- Metadata extraction
- Embeddings
- FAISS vector store
- Retrieval
- Gemini generation

Enterprise Search:
Users can ask natural language questions across all sources.

Return:
- Answers
- Citations
- Related meetings
- Related emails
- Related tickets
- Related documents

# MODULE 2: MEETING INTELLIGENCE

Upload:
- MP3
- WAV
- MP4
- M4A

Generate:
- Transcript
- Speaker identification
- Timestamps
- Executive summary
- Decisions
- Risks
- Blockers
- Follow-ups
- Open questions
- Sentiment analysis

# MODULE 3: AUTOMATED MOM GENERATOR

Generate:
- Meeting title
- Participants
- Date
- Duration
- Agenda
- Executive summary
- Discussion points
- Decisions
- Action items
- Risks
- Open questions
- Next steps

Export:
- PDF
- DOCX
- Markdown

Email attendees automatically.

Store MoMs in RAG knowledge base.

# MODULE 4: ACTION ITEM MANAGEMENT

Extract:
- Task
- Owner
- Due date
- Priority

Track:
- Open
- In progress
- Completed
- Overdue

Generate risk score and escalation recommendations.

# MODULE 5: GOOGLE CALENDAR AUTOMATION

Create:
- Events
- Tasks
- Reminders
- Follow-up meetings

# MODULE 6: JIRA COPILOT & ENGINEERING INTELLIGENCE

Sync:
- Projects
- Epics
- Stories
- Bugs
- Tasks
- Sprints

Store:
- Ticket metadata
- Comments
- Assignees
- Priorities

Features:
- Ticket search
- Similar issue detection
- Root cause suggestions
- Resolution recommendations

Expert Finder:

When a ticket is opened:
- Find engineers who solved similar issues
- Find subject matter experts
- Recommend previous contributors

Engineering Copilot:

Questions:
- Who worked on OAuth before?
- Show Redis incidents.
- Which engineer knows Kafka best?
- What blocked the sprint?

Search across:
- Jira
- Meetings
- Emails
- Docs
- MoMs

# MODULE 7: ORGANIZATIONAL MEMORY ENGINE

Every resolved issue becomes searchable knowledge.

Store:
- Problem
- Root cause
- Solution
- Expert
- Related documentation

# MODULE 8: ENTERPRISE AI ASSISTANT

Ask:
- What risks affect Project Alpha?
- What decisions were made about cloud migration?
- What tickets are likely to miss deadlines?
- Which team is overloaded?

Use RAG across all sources.

# MODULE 9: UIPATH AUTOMATION

Workflow 1:
Employee Onboarding Automation

Workflow:
- Monitor onboarding requests
- Extract data
- Validate with Gemini
- Create onboarding checklist
- Create calendar events
- Notify manager
- Send welcome email

Workflow 2:
Meeting Follow-Up Automation

Workflow:
- Detect new MoM
- Extract action items
- Create tasks
- Create reminders
- Send follow-up emails

Workflow 3:
Policy Compliance Monitoring

Workflow:
- Monitor policy updates
- Generate summaries
- Notify affected teams
- Create compliance tasks

# MODULE 10: ANALYTICS DASHBOARD

Knowledge Analytics:
- Search trends
- Popular documents

Meeting Analytics:
- Meetings processed
- MoMs generated

Engineering Analytics:
- Sprint velocity
- Resolution times
- Team productivity

Executive Analytics:
- Delivery risk
- Team load
- Backlog growth

AI Analytics:
- Query volume
- Token usage
- Cost estimates

# MODULE 11: PRIVACY, COMPLIANCE & REDACTION ENGINE

Before storing transcripts, summaries, MoMs, or RAG entries:

Detect and remove:
- Personal phone numbers
- Personal emails
- Home addresses
- Banking details
- IDs
- HR discussions
- Salary information
- Promotions
- Performance reviews
- Medical information
- Legal matters
- Customer confidential information

Workflow:
1. Generate transcript
2. Run privacy scan
3. Classify content
4. Generate sanitized transcript
5. Generate sanitized MoM
6. Store only sanitized content

Never index restricted content into the vector database.

Generate:
- Redaction summary
- Compliance status
- Audit logs

# UI/UX

Design inspiration:
- Microsoft Copilot
- Atlassian
- Notion AI
- Linear
- Slack

Pages:
- Landing Page
- Dashboard
- Enterprise Search
- Meeting Intelligence
- Meeting History
- MoM Center
- Jira Copilot
- Engineering Intelligence
- Workflow Automation
- Analytics
- Admin
- Settings

# ENGINEERING REQUIREMENTS

Implement:
- Clean Architecture
- Repository Pattern
- Service Layer Pattern
- JWT Authentication
- RBAC
- Logging
- Error handling
- Unit tests
- Integration tests
- API versioning

# DELIVERABLES

Generate:
1. Product Requirements Document
2. Architecture Diagram
3. Database Schema
4. Folder Structure
5. API Design
6. Development Roadmap
7. UI Wireframes
8. Source Code
9. Docker Setup
10. CI/CD Pipeline
11. Deployment Guide
12. Professional README

IMPORTANT:

Do NOT generate code immediately.

First generate:
- Product architecture
- Database design
- API specification
- Folder structure
- Development phases

After approval, generate implementation module-by-module.
