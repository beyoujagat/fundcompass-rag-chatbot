"""Post-processing and Constraint Enforcement for Fund Compass.

Enforces strict compliance with regulatory and architectural constraints:
1. Sentence boundary tokenization protecting decimals (e.g. 0.76%), currency (₹100.50), and abbreviations.
2. Hard cap strictly enforcing <= 3 sentences.
3. URL sanitization guaranteeing exactly 1 citation link: Source: [url](url).
4. Mandatory timestamp footer: Last updated from sources: <YYYY-MM-DD>.
5. Flattening of bullets, lists, and markdown tables into clean prose.
"""

import re
from typing import List, Optional, Tuple

from src.config import DEFAULT_LAST_UPDATED

# Common abbreviations that end in a period but do NOT represent sentence boundaries
ABBREVIATIONS = [
    (r"\bMr\.", "__ABBR_MR__"),
    (r"\bMrs\.", "__ABBR_MRS__"),
    (r"\bMs\.", "__ABBR_MS__"),
    (r"\bDr\.", "__ABBR_DR__"),
    (r"\bProf\.", "__ABBR_PROF__"),
    (r"\bvs\.", "__ABBR_VS__"),
    (r"\be\.g\.", "__ABBR_EG__"),
    (r"\bi\.e\.", "__ABBR_IE__"),
    (r"\betc\.", "__ABBR_ETC__"),
    (r"\bNo\.", "__ABBR_NO__"),
    (r"\bSec\.", "__ABBR_SEC__"),
]


def split_sentences(text: str) -> List[str]:
    """
    Splits text into sentences safely without splitting on:
    - Decimal numbers (e.g., 0.76% or ₹100.50)
    - Currency values with decimals
    - Common abbreviations (e.g., Mr., Dr., e.g., i.e., vs.)
    - Punctuation inside quotes
    """
    if not text:
        return []

    cleaned = text.strip()

    # Step 1: Protect common abbreviations from premature splitting
    for abbr_pat, token in ABBREVIATIONS:
        cleaned = re.sub(abbr_pat, token, cleaned, flags=re.IGNORECASE)

    # Step 2: Split on sentence terminal punctuation followed by space and capital/number/currency/quote
    pattern = r'(?<=[.!?])\s+(?=[A-Z0-9₹"\'“‘])'
    raw_sentences = re.split(pattern, cleaned)

    # Step 3: Restore protected abbreviations and clean up whitespace
    sentences = []
    for s in raw_sentences:
        item = s.strip()
        if not item:
            continue
        for abbr_pat, token in ABBREVIATIONS:
            # Reconstruct original abbreviation
            orig = abbr_pat.replace(r"\b", "").replace(r"\.", ".")
            item = item.replace(token, orig)
        sentences.append(item)

    return sentences


def sanitize_urls(text: str) -> str:
    """
    Strips all raw URLs and markdown links from the body text
    to ensure zero extraneous or duplicate links remain.
    """
    if not text:
        return ""
    # Strip stray LLM bracket citation tokens (e.g. 【4:0†source】 or stray 【)
    cleaned = re.sub(r"【.*?】", "", text)
    cleaned = re.sub(r"【.*?$", "", cleaned)
    cleaned = cleaned.replace("【", "").replace("】", "")
    # Strip markdown links [label](url) leaving just the label or stripping if url only
    cleaned = re.sub(r"\[([^\]]*)\]\(https?://\S+?\)", r"\1", cleaned)
    # Strip bare HTTP/HTTPS URLs
    cleaned = re.sub(r"https?://\S+", "", cleaned)
    # Strip residual empty link markdown e.g. "Source: []()" or "Source:"
    cleaned = re.sub(r"Source:\s*\[\s*\]\(\s*\)", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\n*Source:\s*$", "", cleaned, flags=re.IGNORECASE | re.MULTILINE)
    # Clean up spaces before punctuation (e.g., from stripped citation markers)
    cleaned = re.sub(r"\s+([.,;:!?])", r"\1", cleaned)
    return cleaned.strip()


def flatten_formatting(text: str) -> str:
    """
    Flattens markdown tables, bullet points, and numbered lists into
    coherent prose suitable for sentence boundary enforcement.
    """
    if not text:
        return ""

    lines = text.splitlines()
    processed_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # Skip markdown table separator lines like |---|---|
        if re.match(r"^\|?[-:\s|]+\|?$", stripped):
            continue
        # Clean markdown table rows: replace pipes with commas
        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [c.strip() for c in stripped.strip("|").split("|") if c.strip()]
            stripped = ", ".join(cells) + "."
        # Strip bullet points (*, -, •)
        stripped = re.sub(r"^[-*•]\s+", "", stripped)
        # Strip numbered list markers (1., 2), etc.)
        stripped = re.sub(r"^\d+[\.)]\s+", "", stripped)
        processed_lines.append(stripped)

    # Join lines and collapse excess spaces
    joined = " ".join(processed_lines)
    return re.sub(r"\s+", " ", joined).strip()


def format_citation(source_url: str) -> str:
    """Formats canonical citation string: Source: [url](url)."""
    return f"\n\nSource: [{source_url}]({source_url})"


def format_footer(last_updated: str = DEFAULT_LAST_UPDATED) -> str:
    """Formats canonical timestamp footer: Last updated from sources: <date>."""
    return f"\nLast updated from sources: {last_updated}"


def validate_constraints(
    text: str,
    source_url: Optional[str] = None,
) -> Tuple[bool, List[str]]:
    """
    Validates whether a response satisfies all 3 architectural constraints:
    1. Maximum 3 sentences.
    2. Exactly 1 citation link.
    3. Mandatory timestamp footer present.

    Returns:
        (is_valid, list_of_violations)
    """
    violations = []
    if not text or not text.strip():
        return False, ["Response is empty"]

    # Check footer presence
    footer_match = re.search(r"Last updated from sources:\s*\d{4}-\d{2}-\d{2}", text)
    if not footer_match:
        violations.append("Missing mandatory timestamp footer ('Last updated from sources: YYYY-MM-DD')")

    # Check citation count
    citation_matches = re.findall(r"Source:\s*\[.*?\]\(.*?\)", text)
    if len(citation_matches) != 1:
        violations.append(f"Expected exactly 1 citation link, found {len(citation_matches)}")
    elif source_url and source_url not in citation_matches[0]:
        violations.append(f"Citation URL does not match expected source_url: {source_url}")

    # Check body sentence count
    body = re.sub(r"\n*Source:\s*\[.*?\]\(.*?\)", "", text, flags=re.IGNORECASE)
    body = re.sub(r"\n*Last updated from sources:.*$", "", body, flags=re.IGNORECASE | re.MULTILINE).strip()
    sentences = split_sentences(body)

    if len(sentences) > 3:
        violations.append(f"Sentence count exceeds limit of 3 (found {len(sentences)})")

    return (len(violations) == 0, violations)


def enforce_constraints(
    raw_text: str,
    source_url: str,
    last_updated: str = DEFAULT_LAST_UPDATED,
) -> str:
    """
    Enforces the 3 structural rules:
    1. Maximum 3 sentences.
    2. Exactly 1 citation link: Source: [url](url).
    3. Mandatory footer: Last updated from sources: <YYYY-MM-DD>.

    Sanitizes raw text, strips duplicate URLs, flattens bullet lists/tables,
    truncates to <= 3 sentences, and injects citation + timestamp footer.
    """
    # 1. Strip pre-existing citations and footers to avoid duplication
    cleaned = re.sub(r"\n*Source:\s*\[.*?\]\(.*?\)", "", raw_text, flags=re.IGNORECASE)
    cleaned = re.sub(r"\n*Last updated from sources:.*$", "", cleaned, flags=re.IGNORECASE | re.MULTILINE)

    # 2. Flatten bullets, tables, and list formatting into clean prose
    cleaned = flatten_formatting(cleaned)

    # 3. Strip all embedded URLs and markdown links from the body
    cleaned = sanitize_urls(cleaned)

    # 4. Enforce maximum 3 sentences
    sentences = split_sentences(cleaned)
    if len(sentences) > 3:
        sentences = sentences[:3]

    body = " ".join(sentences).strip()
    if body and not body.endswith((".", "!", "?")):
        body += "."

    # 5. Exactly one citation link
    citation = format_citation(source_url)

    # 6. Mandatory footer
    footer = format_footer(last_updated)

    return f"{body}{citation}{footer}"
