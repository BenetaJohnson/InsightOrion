import re
import logging
from sqlalchemy.orm import Session
import google.generativeai as genai

from backend.config import settings
from backend.app.models.privacy import PrivacyAuditLog

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

# Precompile Regex patterns for high speed
EMAIL_REGEX = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b')
BANK_REGEX = re.compile(r'\b\d{9,12}\b')  # Simple banking accounts / routing numbers
SSN_REGEX = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')

class PrivacyService:
    @staticmethod
    def sanitize(db: Session, tenant_id: str, source_id: str, text: str) -> str:
        """Sanitizes text by matching and removing PII and HR sensitive content."""
        if not text:
            return ""

        sanitized_text = text
        email_count = 0
        phone_count = 0
        bank_count = 0

        # 1. Regex scanning for PII
        # Emails
        emails = EMAIL_REGEX.findall(sanitized_text)
        if emails:
            email_count = len(emails)
            sanitized_text = EMAIL_REGEX.sub("[REDACTED_EMAIL]", sanitized_text)

        # Phone Numbers
        phones = PHONE_REGEX.findall(sanitized_text)
        if phones:
            phone_count = len(phones)
            sanitized_text = PHONE_REGEX.sub("[REDACTED_PHONE]", sanitized_text)

        # SSN and Banking routing numbers
        ssns = SSN_REGEX.findall(sanitized_text)
        if ssns:
            bank_count += len(ssns)
            sanitized_text = SSN_REGEX.sub("[REDACTED_ID]", sanitized_text)

        banks = BANK_REGEX.findall(sanitized_text)
        if banks:
            bank_count += len(banks)
            sanitized_text = BANK_REGEX.sub("[REDACTED_BANK_INFO]", sanitized_text)

        # Register Regex audit logs if hits detected
        if email_count > 0:
            PrivacyService._log_redaction(db, tenant_id, source_id, "PII_EMAIL", email_count, "Masked email addresses")
        if phone_count > 0:
            PrivacyService._log_redaction(db, tenant_id, source_id, "PII_PHONE", phone_count, "Masked phone numbers")
        if bank_count > 0:
            PrivacyService._log_redaction(db, tenant_id, source_id, "FINANCIAL", bank_count, "Masked credit cards, routing, or identifiers")

        # 2. Scanning for HR / Salary / Performance evaluations
        hr_count = 0
        hr_keywords = ["salary", "salary check", "bonus", "promotion", "compensation", "performance review", "disciplinary", "fired", "terminated"]
        
        # Heuristic keywords scanning (Sandbox mode fallback)
        detected_hr_heuristics = False
        lower_txt = sanitized_text.lower()
        for kw in hr_keywords:
            if kw in lower_txt:
                detected_hr_heuristics = True
                break

        if settings.GEMINI_API_KEY:
            try:
                # LLM-assisted redaction for complex semantic entities
                model = genai.GenerativeModel("gemini-2.5-flash")
                prompt = f"""
Analyze this text context and locate any segment mentioning:
- HR discussions (disciplinary actions, performance evaluations, employee conflicts)
- Salary details, wages, bonuses, promotions, or payouts
- Customer-confidential lists or medical data

You must output a sanitized copy of this text where those sections are replaced by: "[REDACTED_HR_SENSITIVE]" or "[REDACTED_CONFIDENTIAL]" as appropriate.
Do NOT output any other text than the sanitized copy.

Text content:
{sanitized_text}
"""
                res = model.generate_content(prompt)
                llm_sanitized = res.text.strip()
                
                # Check if redaction was performed
                if "[REDACTED_HR_SENSITIVE]" in llm_sanitized or "[REDACTED_CONFIDENTIAL]" in llm_sanitized:
                    hr_count += 1
                    sanitized_text = llm_sanitized
            except Exception as e:
                logger.error(f"Gemini privacy scan failed: {e}")

        # If LLM didn't run but heuristics triggered, mask matched sentences
        if hr_count == 0 and detected_hr_heuristics:
            sentences = sanitized_text.split(".")
            for idx, sent in enumerate(sentences):
                lower_sent = sent.lower()
                if any(kw in lower_sent for kw in hr_keywords):
                    # Mask the sentence
                    sentences[idx] = " [REDACTED_HR_SENSITIVE] "
                    hr_count += 1
            sanitized_text = ".".join(sentences)

        if hr_count > 0:
            PrivacyService._log_redaction(db, tenant_id, source_id, "HR_SENSITIVE", hr_count, "Masked salary or performance evaluation sentences")

        return sanitized_text

    @staticmethod
    def _log_redaction(db: Session, tenant_id: str, source_id: str, redacted_type: str, count: int, details: str):
        """Helper to commit audit log entry."""
        try:
            log = PrivacyAuditLog(
                tenant_id=tenant_id,
                source_id=source_id,
                redacted_type=redacted_type,
                count=count,
                log_details=details
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to save privacy audit log: {e}")
            db.rollback()
