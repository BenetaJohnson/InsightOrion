# Import Base and all models to ensure they are registered on the metadata
from backend.app.core.database import Base
from backend.app.models.tenant import Tenant
from backend.app.models.user import User
from backend.app.models.knowledge import Document
from backend.app.models.meeting import Meeting, ActionItem, Comment
from backend.app.models.workflow import Workflow, WorkflowLog
from backend.app.models.jira import JiraTicket
from backend.app.models.memory import ResolvedIssue
from backend.app.models.privacy import PrivacyAuditLog
