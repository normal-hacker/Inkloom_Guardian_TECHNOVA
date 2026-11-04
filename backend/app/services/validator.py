from app.schemas.check import Finding


def validate_findings(findings: list[Finding]) -> list[Finding]:
    valid: list[Finding] = []
    for finding in findings:
        if not finding.rule_id:
            continue
        if not finding.quote or finding.quote.strip() == "":
            continue
        if not finding.source:
            continue
        valid.append(finding)
    return valid
