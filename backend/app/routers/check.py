from fastapi import APIRouter

from app.schemas.check import ContentCheckRequest, ReviewResponse
from app.services.analyzer import analyze_content
from app.services.rule_engine import run_rule_checks
from app.services.validator import validate_findings

router = APIRouter()


@router.post("/check", response_model=ReviewResponse)
def check_content(payload: ContentCheckRequest) -> ReviewResponse:
    findings = run_rule_checks(payload.text)
    validated = validate_findings(findings)
    ai_summary = analyze_content(payload.text)

    return ReviewResponse(
        status="complete",
        findings=validated,
        summary={
            "total_findings": len(validated),
            "blockers": sum(1 for item in validated if item.severity == "blocker"),
            "ai_status": ai_summary["status"],
            "provider": ai_summary["provider"],
        },
    )
