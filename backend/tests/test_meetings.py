import pytest
from backend.app.services.meeting_service import MeetingService
from backend.app.services.export_service import ExportService

def test_transcribe_audio_mock():
    # Test transcribing simulation fallback
    res = MeetingService.transcribe_audio("cloud_migration_discussion.mp3")
    assert "text" in res
    assert "segments" in res
    assert len(res["segments"]) > 0
    # Match correct text segment
    assert "GCP" in res["text"] or "AWS" in res["text"]

def test_generate_mom_mock():
    transcript = "Sarah: Welcome. John: Migrated database to AWS. Let's finish by next Friday."
    mom = MeetingService.generate_mom(transcript, "AWS Cloud Migration Sync", "2026-06-06")
    
    assert mom["title"] == "AWS Cloud Migration Sync"
    assert mom["date"] == "2026-06-06"
    assert "executive_summary" in mom
    assert len(mom["action_items"]) > 0
    assert "assignee_email" in mom["action_items"][0]

def test_mom_exporters():
    mock_mom = {
        "title": "Project Alpha Status Review",
        "date": "2026-06-06",
        "executive_summary": "The team aligned on core GCP deliverables.",
        "agenda_covered": ["Progress reviews"],
        "key_discussion_points": [{"topic": "Database performance", "summary": "Migrated AWS systems."}],
        "decisions_made": ["Upgrade GCP memory quotas."],
        "action_items": [{"title": "Fix cookie tokens", "assignee_email": "admin@test.com", "priority": "HIGH", "due_date": "2026-06-12", "description": "Review cookies"}],
        "risks": [{"description": "Timeline slippage", "dependency": "Team availability", "escalation": "Escalate to manager"}],
        "open_questions": ["Scale GCP clusters?"],
        "next_meeting_suggestions": {"agenda": ["Demo review"], "recommended_participants": ["Sarah"], "follow_up_topics": ["GCP costs"]}
    }
    
    # MD
    md_out = ExportService.to_markdown(mock_mom)
    assert "# Minutes of Meeting:" in md_out
    assert "Project Alpha Status Review" in md_out
    
    # HTML
    html_out = ExportService.to_html(mock_mom)
    assert "<!DOCTYPE html>" in html_out
    assert "Project Alpha Status Review" in html_out

    # DOCX
    docx_out = ExportService.to_docx(mock_mom)
    assert docx_out.getvalue() is not None
