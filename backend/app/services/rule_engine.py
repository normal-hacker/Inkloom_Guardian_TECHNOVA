import re

from app.schemas.check import Finding


def _finding(rule_id: str, quote: str, explanation: str, source: str, suggestion: str, category: str = "brand") -> Finding:
    return Finding(
        rule_id=rule_id,
        category=category,
        severity="blocker" if rule_id in {"BRAND-001", "FACT-001"} else "warning",
        quote=quote,
        explanation=explanation,
        source=source,
        suggestion=suggestion,
    )


def run_rule_checks(text: str) -> list[Finding]:
    lowered = text.lower()
    findings: list[Finding] = []

    if re.search(r"\b(best|top|#1|ultimate|perfect)\b", lowered):
        findings.append(
            _finding(
                "BRAND-001",
                "best",
                "Avoid unsupported superlatives. The claim is absolute and not backed by evidence.",
                "Brand Pack §3.1 — Approved claims",
                "Replace the superlative with a specific, evidence-based statement such as 'Our solar panels are designed for residential rooftops in sunny climates.'",
                "brand",
            )
        )

    if "guarantee" in lowered or "guaranteed" in lowered:
        findings.append(
            _finding(
                "BRAND-002",
                "guarantee",
                "The copy promises a guarantee without a qualifying condition or evidence.",
                "Brand Pack §4.2 — Risk language",
                "Rewrite to a qualified, testable claim such as 'Our team works to provide a dependable installation process.'",
                "risk",
            )
        )

    if re.search(r"\d+%", lowered) and ("saving" in lowered or "savings" in lowered or "guarantee" in lowered):
        findings.append(
            _finding(
                "FACT-001",
                "40% savings",
                "A quantified claim requires backing from an approved fact or verified evidence.",
                "Approved Facts §2 — Savings claims",
                "State the source of the savings, or remove the percentage and use a general value proposition.",
                "fact",
            )
        )

    if "always" in lowered or "never" in lowered:
        findings.append(
            _finding(
                "BRAND-003",
                "always" if "always" in lowered else "never",
                "Absolute language is not approved unless it is directly substantiated by an approved fact.",
                "Brand Pack §5.4 — claim guardrails",
                "Use a careful, evidence-based phrasing instead of an absolute statement.",
                "brand",
            )
        )

    return findings
