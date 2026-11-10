"""Deterministic Intent Classification Guardrail for Fund Compass.

Classifies incoming user queries into one of four deterministic compliance states:
1. FACTUAL_INQUIRY (FACTUAL): Expense ratios, exit loads, SIP minimums, lock-in, riskometers, benchmarks, operations.
2. ADVISORY: Advice seeking, subjective comparisons, recommendations, roleplay jailbreaks.
3. PERFORMANCE_REQUEST: Return calculations, CAGR queries, past performance evaluations.
4. OUT_OF_SCOPE: Non-mutual fund inquiries, generic chit-chat, stocks, cryptocurrency.

Prioritizes accuracy and compliance before any retrieval or LLM inference.
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Pattern


class QueryIntent(str, Enum):
    """Compliance-enforced intent classification categories."""
    FACTUAL = "factual"
    FACTUAL_INQUIRY = "factual"  # Explicit canonical alias as per implementation plan
    ADVISORY = "advisory"
    PERFORMANCE_REQUEST = "performance_request"
    OUT_OF_SCOPE = "out_of_scope"


# ----------------------------------------------------------------------
# 1. Advisory, Recommendation & Speculative Patterns (Hard Refusal)
# ----------------------------------------------------------------------
ADVISORY_PATTERNS: List[Pattern] = [
    # Direct advice queries
    re.compile(r"\bshould i (?:invest|buy|sell|redeem|switch|choose|pick)\b", re.IGNORECASE),
    re.compile(r"\bshall i (?:invest|buy|sell|redeem|switch|choose|pick)\b", re.IGNORECASE),
    re.compile(r"\bcan i invest\b", re.IGNORECASE),
    re.compile(r"\bwhere should i (?:put|park|invest) my money\b", re.IGNORECASE),
    re.compile(r"\bwhere to invest\b", re.IGNORECASE),
    re.compile(r"\bwhich fund to (?:buy|pick|choose|invest in)\b", re.IGNORECASE),
    re.compile(r"\bwhich fund should i\b", re.IGNORECASE),
    re.compile(r"\bwhich fund would you\b", re.IGNORECASE),
    re.compile(r"\bif you were (?:me|in my shoes)\b", re.IGNORECASE),
    re.compile(r"\bif you had (?:₹|\$|rs\.?|inr)?\s*\d+\b", re.IGNORECASE),
    # Recommendation & Suggestion keywords
    re.compile(r"\b(?:recommend|suggestion|suggesting|recommendation)\b", re.IGNORECASE),
    re.compile(r"\bsuggest(?:\s+some|\s+me|\s+a)?\b", re.IGNORECASE),
    re.compile(r"\badvice\b", re.IGNORECASE),
    re.compile(r"\badvise(?:\s+me)?\b", re.IGNORECASE),
    re.compile(r"\bfinancial advi[cs]e\b", re.IGNORECASE),
    re.compile(r"\bportfolio (?:suggestion|recommendation|advice|review)\b", re.IGNORECASE),
    # Subjective evaluation & Ranking
    re.compile(r"\bwhich fund is (?:better|best|safer|safest|superior)\b", re.IGNORECASE),
    re.compile(r"\bwhich is (?:better|best|safer|safest)\b", re.IGNORECASE),
    re.compile(r"\bbest (?:mutual fund|fund|scheme|investment|option)\b", re.IGNORECASE),
    re.compile(r"\bbest to worst\b", re.IGNORECASE),
    re.compile(r"\bworst to best\b", re.IGNORECASE),
    re.compile(r"\brank(?:ing)?\b", re.IGNORECASE),
    re.compile(r"\brank the (?:5 |five )?(?:hdfc |mutual )?(?:funds|schemes)\b", re.IGNORECASE),
    re.compile(r"\bsafer than\b", re.IGNORECASE),
    re.compile(r"\bbetter than\b", re.IGNORECASE),
    re.compile(r"\bis it (?:good|safe|wise|worth|profitable) (?:to invest|for investment|to buy)\b", re.IGNORECASE),
    re.compile(r"\bis it (?:a )?good (?:fund|investment|buy|scheme)\b", re.IGNORECASE),
    re.compile(r"\bworth investing\b", re.IGNORECASE),
    re.compile(r"\bbuy or sell\b", re.IGNORECASE),
    # Speculative future return prediction & Capital safety
    re.compile(r"\bwill this fund give\b", re.IGNORECASE),
    re.compile(r"\bwill (?:hdfc|this|the) .* give\b", re.IGNORECASE),
    re.compile(r"\bwill it give\b", re.IGNORECASE),
    re.compile(r"\bhow much return will i get\b", re.IGNORECASE),
    re.compile(r"\bexpected returns?\b", re.IGNORECASE),
    re.compile(r"\bpredict(?:ed)? returns?\b", re.IGNORECASE),
    re.compile(r"\btarget nav\b", re.IGNORECASE),
    re.compile(r"\bguarantee(?:d)?(?:\s+returns?)?\b", re.IGNORECASE),
    re.compile(r"\bcapital safe(?:ty)?\b", re.IGNORECASE),
    re.compile(r"\b(?:100%|completely|totally|fully)\s+safe\b", re.IGNORECASE),
    re.compile(r"\b(?:is |are )?(?:my )?principal (?:capital )?safe\b", re.IGNORECASE),
    # Roleplay / Jailbreak overrides & Persona Coercion
    re.compile(r"\bact as (?:a |an |my )?(?:unrestricted |financial )?(?:advisor|financial advisor|fund manager|broker)\b", re.IGNORECASE),
    re.compile(r"\bpretend (?:you are|to be) (?:a |an |my )?(?:advisor|financial advisor)\b", re.IGNORECASE),
    re.compile(r"\bpick (?:one|a|some)? (?:scheme|fund|stock)s?\b", re.IGNORECASE),
    re.compile(r"\bjailbreak\b", re.IGNORECASE),
    re.compile(r"\bignore (?:all )?(?:previous|prior) (?:instructions|rules|guardrails)\b", re.IGNORECASE),
]

# ----------------------------------------------------------------------
# 2. Performance & Return Calculation Patterns (Factsheet Redirection)
# ----------------------------------------------------------------------
PERFORMANCE_PATTERNS: List[Pattern] = [
    re.compile(r"\b(?:cagr|historical return|past return|trailing return|annualized return)\b", re.IGNORECASE),
    re.compile(r"\b\d+\s*(?:y|yr|year)s?\s*(?:historical|past|trailing|cagr)?\s*returns?\b", re.IGNORECASE),
    re.compile(r"\breturns? (?:over|for|in) (?:the )?(?:last|past)?\s*\d+\s*(?:y|yr|year|month)s?\b", re.IGNORECASE),
    re.compile(r"\bcalculate (?:my )?returns?\b", re.IGNORECASE),
    re.compile(r"\bcompare returns?\b", re.IGNORECASE),
    re.compile(r"\breturn comparison\b", re.IGNORECASE),
    re.compile(r"\breturns? (?:comparison|of this fund|generated)\b", re.IGNORECASE),
    re.compile(r"\bpast performance\b", re.IGNORECASE),
    re.compile(r"\bhistorical performance\b", re.IGNORECASE),
    re.compile(r"\bperformance history\b", re.IGNORECASE),
    re.compile(r"\btrack record\b", re.IGNORECASE),
    re.compile(r"\bhow has this fund performed\b", re.IGNORECASE),
    re.compile(r"\bhow did this fund perform\b", re.IGNORECASE),
    re.compile(r"\bnav history\b", re.IGNORECASE),
    re.compile(r"\bhistorical nav\b", re.IGNORECASE),
]

FACTUAL_KEYWORDS: List[str] = [
    # Costs & Fees
    "expense ratio",
    "expense",
    "exit load",
    "entry load",
    "load",
    "ter",
    "fees",
    "charges",
    # Investment Limits
    "sip",
    "lumpsum",
    "lump sum",
    "minimum",
    "initial investment",
    "subsequent",
    "installment",
    # Statutory & Lock-in
    "lock in",
    "lock-in",
    "lockin",
    "holding period",
    "elss",
    "80c",
    "section 80c",
    "tax saver",
    "tax saving",
    "tax",
    # Risk & Governance
    "riskometer",
    "risk",
    "benchmark",
    "manager",
    "fund manager",
    "factsheet",
    "fact sheet",
    "sid",
    "kim",
    # Operations & Statements
    "statement",
    "capital gains",
    "cas",
    "consolidated account statement",
    "download",
    "mfcentral",
    "cams",
    # Scheme Identifiers & Metadata
    "mid cap",
    "mid-cap",
    "midcap",
    "small cap",
    "small-cap",
    "smallcap",
    "gold etf",
    "gold fof",
    "gold fund",
    "large cap",
    "large-cap",
    "largecap",
    "top 100",
    "growth",
    "direct",
    "nav",
    "category",
    "fund house",
    "amc",
    "scheme",
    "cut-off",
    "cut off",
    "hdfc",
]

# Precompile factual patterns with word boundaries to prevent substring collisions (e.g. 'ter' in 'minister')
FACTUAL_PATTERNS: List[Pattern] = [
    re.compile(r"\b" + re.escape(kw) + r"\b", re.IGNORECASE) for kw in FACTUAL_KEYWORDS
]



@dataclass
class IntentClassificationResult:
    """Detailed result of intent classification analysis."""
    intent: QueryIntent
    confidence: float = 1.0
    matched_pattern: Optional[str] = None
    matched_keywords: List[str] = field(default_factory=list)

    @property
    def is_refusal(self) -> bool:
        """Indicates whether the query should trigger a guardrail refusal."""
        return self.intent in (
            QueryIntent.ADVISORY,
            QueryIntent.PERFORMANCE_REQUEST,
            QueryIntent.OUT_OF_SCOPE,
        )


def analyze_intent(query: str) -> IntentClassificationResult:
    """
    Analyzes query and returns structured classification results.
    Deterministic execution order enforces regulatory priority:
    Stage A: Advisory & Jailbreak checks (Immediate compliance refusal)
    Stage B: Performance & Historical return calculation checks (Factsheet redirect)
    Stage C: Factual scheme parameters checks (Vector search & Grounded generation)
    Stage D: Out-of-scope fallback (Polite domain redirect)
    """
    clean_query = query.lower().strip()

    # Stage A: Check for Advisory patterns first (Hard Compliance Gate)
    for pattern in ADVISORY_PATTERNS:
        match = pattern.search(clean_query)
        if match:
            return IntentClassificationResult(
                intent=QueryIntent.ADVISORY,
                confidence=1.0,
                matched_pattern=match.group(0),
            )

    # Stage B: Check for Performance / Historical calculation patterns
    for pattern in PERFORMANCE_PATTERNS:
        match = pattern.search(clean_query)
        if match:
            return IntentClassificationResult(
                intent=QueryIntent.PERFORMANCE_REQUEST,
                confidence=1.0,
                matched_pattern=match.group(0),
            )

    # Stage C: Check for Factual inquiry keywords using word boundaries
    found_keywords = [
        kw for kw, pat in zip(FACTUAL_KEYWORDS, FACTUAL_PATTERNS) if pat.search(clean_query)
    ]
    if found_keywords:
        return IntentClassificationResult(
            intent=QueryIntent.FACTUAL_INQUIRY,
            confidence=1.0,
            matched_keywords=found_keywords,
        )

    # Stage D: Out-of-Scope (No mutual fund intent detected)
    return IntentClassificationResult(
        intent=QueryIntent.OUT_OF_SCOPE,
        confidence=1.0,
    )


def classify_intent(query: str) -> QueryIntent:
    """
    Classifies a user query into FACTUAL, ADVISORY, PERFORMANCE_REQUEST, or OUT_OF_SCOPE.
    Direct integration endpoint for API routes and guardrail orchestrator.
    """
    result = analyze_intent(query)
    return result.intent
