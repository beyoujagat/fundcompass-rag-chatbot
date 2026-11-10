"""Unit tests for response formatting constraints and post-processor.

Validates:
1. Sentence boundary splitting preserving decimals (0.76%), currency (₹100.50), and abbreviations (EV-P4-04).
2. Hard cap strictly enforcing <= 3 sentences (EV-P4-03).
3. Exactly one citation link, removing embedded links and bare URLs (EV-P4-05).
4. Mandatory timestamp footer presence (EV-P4-06).
5. Bullet points and markdown table flattening (EC-FMT-05).
6. Constraint validation and audit functions.
"""

import re
import unittest

from src.rag.postprocessor import (
    enforce_constraints,
    flatten_formatting,
    format_citation,
    format_footer,
    sanitize_urls,
    split_sentences,
    validate_constraints,
)


class TestConstraints(unittest.TestCase):

    def test_split_sentences_preserves_decimals(self):
        """EV-P4-04: Test decimals and currency figures are protected."""
        text = "The expense ratio is 0.76%. The minimum SIP is ₹100.50. The exit load is 1.00%."
        sentences = split_sentences(text)
        self.assertEqual(len(sentences), 3)
        self.assertEqual(sentences[0], "The expense ratio is 0.76%.")
        self.assertEqual(sentences[1], "The minimum SIP is ₹100.50.")
        self.assertEqual(sentences[2], "The exit load is 1.00%.")

    def test_split_sentences_preserves_abbreviations(self):
        """Test abbreviations like Mr., Dr., e.g., i.e. do not cause false splits."""
        text = "The fund is managed by Mr. Chirag Setalvad. He oversees equity assets (e.g. mid-cap portfolio). Next sentence."
        sentences = split_sentences(text)
        self.assertEqual(len(sentences), 3)
        self.assertIn("Mr. Chirag Setalvad", sentences[0])
        self.assertIn("e.g. mid-cap portfolio", sentences[1])

    def test_enforce_constraints_truncates_to_max_three_sentences(self):
        """EV-P4-03: Hard truncation to <= 3 sentences."""
        long_text = (
            "Sentence one is here. Sentence two is here. Sentence three is here. "
            "Sentence four should be omitted. Sentence five should also be omitted."
        )
        url = "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth"
        date = "2026-11-10"

        result = enforce_constraints(long_text, url, date)

        # Check that sentences 4 and 5 are not in result
        self.assertNotIn("Sentence four", result)
        self.assertNotIn("Sentence five", result)
        self.assertIn("Sentence one is here.", result)
        self.assertIn("Sentence two is here.", result)
        self.assertIn("Sentence three is here.", result)

        # Check single citation
        citation_matches = re.findall(r"Source:\s*\[.*?\]\(.*?\)", result)
        self.assertEqual(len(citation_matches), 1)
        self.assertIn(url, citation_matches[0])

        # Check footer
        self.assertIn(f"Last updated from sources: {date}", result)

    def test_enforce_constraints_exact_one_citation(self):
        """EV-P4-05: Exactly one citation link appended and body URLs stripped."""
        text_with_urls = (
            "Visit https://example.com for info. "
            "Also see https://another.com for more details."
        )
        url = "https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth"
        result = enforce_constraints(text_with_urls, url, "2026-11-10")

        self.assertNotIn("https://example.com", result)
        self.assertNotIn("https://another.com", result)
        self.assertIn(url, result)

    def test_sanitize_urls_markdown_and_bare(self):
        """Verify sanitize_urls strips both markdown links and raw URLs."""
        text = "Check [Groww Portal](https://groww.in/test) or visit https://amc.com/direct for facts."
        sanitized = sanitize_urls(text)
        self.assertNotIn("https://groww.in/test", sanitized)
        self.assertNotIn("https://amc.com/direct", sanitized)
        self.assertIn("Groww Portal", sanitized)

    def test_flatten_formatting_bullets_and_tables(self):
        """EC-FMT-05: Markdown bullet lists and tables flattened into prose."""
        raw_markdown = (
            "Key facts for the fund:\n"
            "* Direct expense ratio is 0.76%.\n"
            "* Exit load is 1.00% if redeemed in 1 year.\n"
            "* Minimum SIP is ₹100.\n"
            "* Fourth item exceeding three."
        )
        url = "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth"
        result = enforce_constraints(raw_markdown, url, "2026-11-10")

        self.assertNotIn("*", result)
        self.assertNotIn("Fourth item", result)
        self.assertIn("Direct expense ratio is 0.76%.", result)
        self.assertIn("Exit load is 1.00%", result)

    def test_validate_constraints_passes_on_enforced_output(self):
        """Verify validate_constraints approves compliant responses."""
        url = "https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth"
        text = "Sentence one. Sentence two. Sentence three."
        enforced = enforce_constraints(text, url, "2026-11-10")

        is_valid, violations = validate_constraints(enforced, source_url=url)
        self.assertTrue(is_valid)
        self.assertEqual(len(violations), 0)

    def test_validate_constraints_flags_violations(self):
        """Verify validate_constraints flags missing footer, extra URLs, or >3 sentences."""
        # Missing footer
        bad_output = "One sentence here.\n\nSource: [https://groww.in](https://groww.in)"
        is_valid, violations = validate_constraints(bad_output)
        self.assertFalse(is_valid)
        self.assertTrue(any("footer" in v.lower() for v in violations))

        # Too many sentences
        bad_sentences = (
            "Sentence 1. Sentence 2. Sentence 3. Sentence 4.\n\n"
            "Source: [https://groww.in](https://groww.in)\n"
            "Last updated from sources: 2026-11-10"
        )
        is_valid, violations = validate_constraints(bad_sentences)
        self.assertFalse(is_valid)
        self.assertTrue(any("sentence count" in v.lower() for v in violations))


if __name__ == "__main__":
    unittest.main()
