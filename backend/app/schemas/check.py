from pydantic import BaseModel, Field


class ContentCheckRequest(BaseModel):
    text: str = Field(..., min_length=1)
    title: str | None = None


class Finding(BaseModel):
    rule_id: str
    category: str
    severity: str
    quote: str
    explanation: str
    source: str
    suggestion: str


class ReviewResponse(BaseModel):
    status: str
    findings: list[Finding]
    summary: dict[str, int | str]
