from app.services.rule_engine import run_rule_checks


def test_blocker_rules_are_detected_for_superlatives_and_guarantees() -> None:
    text = "Our panels are the best on the market and guarantee 40% savings!"

    findings = run_rule_checks(text)

    assert any(item.rule_id == "BRAND-001" for item in findings)
    assert any(item.rule_id == "BRAND-002" for item in findings)
    assert any(item.rule_id == "FACT-001" for item in findings)


def test_no_findings_for_safe_copy() -> None:
    text = "Our solar panels are designed for residential rooftops and include a practical maintenance plan."

    findings = run_rule_checks(text)

    assert findings == []
