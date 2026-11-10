"""PII and Sensitive Financial Data Filter for Fund Compass.

Implements Stage 1 compliance guardrails to detect, intercept, and sanitize
sensitive personal identification and financial credentials before prompt ingress.
Zero-PII guarantee: PAN, Aadhaar, Mobile, Email, OTPs, and Bank/Folio numbers are blocked.
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Pattern, Tuple


class PIIType(str, Enum):
    """Categorization of sensitive personal identifiable information."""
    PAN = "pan_card"
    AADHAAR = "aadhaar_number"
    PHONE = "mobile_phone"
    EMAIL = "email_address"
    OTP = "otp_credential"
    ACCOUNT_OR_FOLIO = "account_or_folio"


# ----------------------------------------------------------------------
# Regex Scanners as Mandated by Problem Statement & Implementation Plan
# ----------------------------------------------------------------------

# 1. PAN Card: [A-Z]{5}[0-9]{4}[A-Z]{1} (Standard and spaced/obfuscated)
PAN_STANDARD_PATTERN: Pattern = re.compile(r"\b[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}\b")
PAN_SPACED_PATTERN: Pattern = re.compile(
    r"\b[A-Za-z]\s+[A-Za-z]\s+[A-Za-z]\s+[A-Za-z]\s+[A-Za-z]\s+[0-9]\s+[0-9]\s+[0-9]\s+[0-9]\s+[A-Za-z]\b"
)

# 2. Aadhaar Number: 12-digit Indian national identity pattern (\d{4}\s?\d{4}\s?\d{4})
AADHAAR_SPACED_PATTERN: Pattern = re.compile(r"\b\d{4}\s\d{4}\s\d{4}\b")
AADHAAR_UNSPACED_PATTERN: Pattern = re.compile(r"\b[1-9]\d{11}\b")

# 3. Mobile Phone: Indian 10-digit formats with optional +91 prefix
PHONE_PATTERN: Pattern = re.compile(r"(?:\+91[\-\s]?)?[6-9]\d{9}\b")

# 4. Email Address: Standard RFC-5322 structure
EMAIL_PATTERN: Pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")

# 5. OTP / Verification Code: Keyword 'otp', 'one-time password', or 'verification code' followed by 4-8 digits
OTP_PATTERN: Pattern = re.compile(
    r"\b(?:otp|one[-\s]time[-\s]password|verification\s+code)\b(?:\s*(?:is|was|code|=|:|-))*\s*\d{4,8}\b",
    re.IGNORECASE,
)

# 6. Bank Account / Folio Identifier: Keyword followed by 6-18 digits or alphanumeric folio
ACCOUNT_OR_FOLIO_PATTERN: Pattern = re.compile(
    r"\b(?:account|ac|folio|a/c)\s*(?:number|no\.?|#)?\s*(?:is|was|=|:|-)?\s*[\d/]{6,18}\b",
    re.IGNORECASE,
)

# Mandatory Standard Privacy Warning
PII_REFUSAL_MESSAGE: str = (
    "For your privacy and security, Fund Compass strictly prohibits entering sensitive personal "
    "or financial details such as PAN, Aadhaar, account numbers, OTPs, or contact information. "
    "Please rephrase your question without including any personal data."
)


@dataclass
class PIIScanResult:
    """Detailed result of PII scanning."""
    has_pii: bool
    detected_types: List[PIIType] = field(default_factory=list)
    warning_message: Optional[str] = None
    sanitized_text: Optional[str] = None
    matches: Dict[str, List[str]] = field(default_factory=dict)


def scan_pii(text: str) -> PIIScanResult:
    """
    Scans input text comprehensively for all 6 categories of sensitive personal data.
    Returns structured PIIScanResult detailing detected entities and sanitized text.
    """
    if not text or not text.strip():
        return PIIScanResult(has_pii=False, sanitized_text=text)

    detected: List[PIIType] = []
    matches_dict: Dict[str, List[str]] = {}
    clean_text = text

    # 1. PAN Card Check
    pan_matches = PAN_STANDARD_PATTERN.findall(text) + PAN_SPACED_PATTERN.findall(text)
    if pan_matches:
        detected.append(PIIType.PAN)
        matches_dict[PIIType.PAN.value] = pan_matches
        clean_text = PAN_STANDARD_PATTERN.sub("[REDACTED_PAN]", clean_text)
        clean_text = PAN_SPACED_PATTERN.sub("[REDACTED_PAN]", clean_text)

    # 2. Aadhaar Number Check
    aadhaar_matches = AADHAAR_SPACED_PATTERN.findall(text)
    if re.search(r"\b(?:aadhaar|adhar|uidai|uid)\b", text, re.IGNORECASE):
        aadhaar_matches.extend(AADHAAR_UNSPACED_PATTERN.findall(text))
    else:
        for match in AADHAAR_UNSPACED_PATTERN.findall(text):
            aadhaar_matches.append(match)

    if aadhaar_matches:
        detected.append(PIIType.AADHAAR)
        matches_dict[PIIType.AADHAAR.value] = aadhaar_matches
        clean_text = AADHAAR_SPACED_PATTERN.sub("[REDACTED_AADHAAR]", clean_text)
        clean_text = AADHAAR_UNSPACED_PATTERN.sub("[REDACTED_AADHAAR]", clean_text)

    # 3. Mobile Phone Check
    phone_matches = PHONE_PATTERN.findall(text)
    if phone_matches:
        detected.append(PIIType.PHONE)
        matches_dict[PIIType.PHONE.value] = phone_matches
        clean_text = PHONE_PATTERN.sub("[REDACTED_PHONE]", clean_text)

    # 4. Email Address Check
    email_matches = EMAIL_PATTERN.findall(text)
    if email_matches:
        detected.append(PIIType.EMAIL)
        matches_dict[PIIType.EMAIL.value] = email_matches
        clean_text = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", clean_text)

    # 5. OTP / Verification Code Check
    otp_matches = OTP_PATTERN.findall(text)
    if otp_matches:
        detected.append(PIIType.OTP)
        matches_dict[PIIType.OTP.value] = otp_matches
        clean_text = OTP_PATTERN.sub("[REDACTED_OTP]", clean_text)

    # 6. Bank Account / Folio Identifier Check
    account_matches = ACCOUNT_OR_FOLIO_PATTERN.findall(text)
    if account_matches:
        detected.append(PIIType.ACCOUNT_OR_FOLIO)
        matches_dict[PIIType.ACCOUNT_OR_FOLIO.value] = account_matches
        clean_text = ACCOUNT_OR_FOLIO_PATTERN.sub("[REDACTED_ACCOUNT]", clean_text)

    has_pii = len(detected) > 0
    return PIIScanResult(
        has_pii=has_pii,
        detected_types=detected,
        warning_message=PII_REFUSAL_MESSAGE if has_pii else None,
        sanitized_text=clean_text if has_pii else text,
        matches=matches_dict,
    )


def sanitize_pii(text: str) -> str:
    """
    Sanitizes any detected sensitive credentials from text by replacing them
    with descriptive redaction tokens ([REDACTED_PAN], [REDACTED_PHONE], etc.).
    """
    result = scan_pii(text)
    return result.sanitized_text or text


def detect_pii(text: str) -> Tuple[bool, Optional[str]]:
    """
    Scans input text for sensitive personal identification or account information.
    Direct integration endpoint for API routes and guardrail filters.

    Returns:
        (True, refusal_message) if sensitive data is detected.
        (False, None) if the input is clean.
    """
    scan = scan_pii(text)
    if scan.has_pii:
        return True, scan.warning_message
    return False, None
