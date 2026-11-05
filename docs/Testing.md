# Testing — Plan & Verification Results

**Goal:** Prove the workflow works, the guardrails hold, and the system accuracy is measured rigorously and honestly.

---

## 1. Test Pyramid & Execution Summary

| Test Layer | Framework / Harness | Test Suite File | Tests | Status |
|---|---|---|---|---|
| **Environment Configuration** | Vitest | `tests/env.test.ts` | 3 | **PASSED** (10ms) |
| **API Health & Connectivity** | Vitest | `tests/health.test.ts` | 2 | **PASSED** (17ms) |
| **Deterministic Rule Engine** | Vitest | `tests/engine.test.ts` | 16 | **PASSED** (28ms) |
| **Golden Set Evaluation** | Vitest + YAML | `tests/golden/eval.test.ts` | 21 | **PASSED** (25ms) |
| **Data Layer & Triggers** | Vitest + `pg-mem` | `tests/s1-data.test.ts` | 10 | **PASSED** (2.57s) |
| **Intake & Check Pipeline** | Vitest | `tests/s3-intake.test.ts` | 6 | **PASSED** (309ms) |
| **Decisions & Guidelines** | Vitest + `pg-mem` | `tests/s4-decisions.test.ts` | 8 | **PASSED** (4.17s) |
| **Insights Aggregations** | Vitest + `pg-mem` | `tests/s6-insights.test.ts` | 3 | **PASSED** (2.31s) |
| **Security & Hardening** | Vitest | `tests/s7-security.test.ts` | 5 | **PASSED** (354ms) |
| **Total** | - | - | **74** | **100% PASS** |

---

## 2. Golden Set Benchmark Evaluation (Stage S7)

Evaluated across 20 labelled test documents (`frontend/tests/golden/labels.yaml`) encompassing superlatives, guarantees, banned terms, casing errors, excessive punctuation, high pressure, competitor comparisons, confidential codename leaks, accessibility violations, compound multi-issue copy, prompt injections, XSS injections, and clean compliant copy:

```
================ GOLDEN SET BENCHMARK RESULTS ================
Total Cases:     20
True Positives:  20
False Positives: 1
False Negatives: 0
Precision:       95.24% (Target >= 90%)
Recall:          100.00% (Target >= 90%)
F1-Score:        97.56%
==============================================================
```

### Breakdown by Category:
- **Tone Violations (`TONE-001`, `TONE-002`, `TONE-003`):** 100% precision and recall. Single `!` punctuation does not trigger false positives.
- **Terminology (`TERM-001`, `TERM-002`):** Correctly detects banned glossary terms and camel-case formatting (`SunLink`).
- **Claim & Guarantees (`CLAIM-001`, `CLAIM-002`):** Detects unverified superlatives and absolute warranty guarantees.
- **Fact Proximity Window (`NUM-001`):** Accurately distinguishes between approved fact ranges ($18-24\%$, $25\text{-year}$, $1-2\text{ days}$, $12\text{-year}$, $22.5\%$, $14\text{ cities}$) and ungrounded claims ($40\%$, $30\%$).
- **Confidentiality (`CONF-001`):** Flags internal codename `Project Helios` and email addresses.
- **Accessibility (`ACC-002`, `ACC-003`):** Identifies non-descriptive anchor copy ("click here") and runs of 4+ ALL-CAPS words.
- **Clean Controls:** Produces zero findings on compliant copy (Cases 14, 15, 16, 20).
- **Injection Attacks:** Prompt injections and XSS vectors are treated as inert literal text and flagged accurately for policy violations without script execution.

---

## 3. Security Hardening Suite Verification

The security test suite (`frontend/tests/s7-security.test.ts`) verifies 5 core defenses:

1. **Multi-Tenant Workspace Isolation (IDOR Prevention):**
   - Access attempts to content items or findings belonging to another workspace are strictly rejected with `404 not_found` / `WorkflowError`.
2. **Session Tamper Resistance:**
   - Stateless HMAC-SHA256 session tokens are cryptographically signed.
   - Any payload tampering (such as modifying `role` from `creator` to `manager`) or signature mutation causes immediate invalidation (`verifySessionToken` returns `null`).
3. **Role Escalation Protection:**
   - Attempting to invoke review decisions (`approved`, `rejected`, `changes_requested`) or dismiss blocker findings using a `creator` role is denied (`403 forbidden`).
4. **Input Sanitization & Injection Defense:**
   - Malicious payloads containing `<script>`, `onerror` attributes, and prompt injections are processed safely as raw text strings without browser execution or AST distortion.
5. **Upload Size Limit Defense:**
   - Payloads and file uploads exceeding the 10 MB limit are rejected with an explicit size violation.

---

## 4. In-Browser Automated Self-Tests (`/selftest`)
In addition to server-side Vitest tests, an automated in-browser test runner runs at `/selftest`. It executes 12 deterministic test cases client-side without network calls, verifying:
- Exact character slice equality: `quote === text.slice(start, end)`
- UTF-16 surrogate pair and emoji alignment
- Overlap de-duplication and severity ranking
- Word-level diff computation
- PII redaction and offset restoration
