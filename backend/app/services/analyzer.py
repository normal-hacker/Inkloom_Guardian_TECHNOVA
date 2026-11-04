from datetime import datetime, timezone


def analyze_content(text: str) -> dict:
    lowered = text.lower()
    evidence = []

    if "guarantee" in lowered:
        evidence.append("Marketing copy contains a guarantee claim.")
    if "best" in lowered:
        evidence.append("The text uses a superlative without supporting evidence.")
    if "40%" in lowered or "40 percent" in lowered:
        evidence.append("The copy contains a specific savings claim without proof.")

    return {
        "provider": "mock",
        "model": "mock-model",
        "status": "passed" if evidence else "no-issues-detected",
        "summary": "AI check evaluated the copy against the supplied brief.",
        "evidence": evidence,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
