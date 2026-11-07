# Testing — Plan & Verification Results

**Goal:** Prove the workflow works, the guardrails hold, and the system accuracy is measured rigorously and honestly.

---

## 1. Test Pyramid & Execution Summary

| Test Layer | Framework / Harness | Test Suite File | Tests | Status |
|---|---|---|---|---|
| **Anti-Drift Verification** | Vitest + Custom Scripts | `tests/anti-drift.test.ts` | 6 | **PASSED** (80ms) |
| **Domain Derivations** | Vitest | `tests/domain-derive.test.ts` | 19 | **PASSED** (10ms) |
| **Base UI Components** | Vitest + RTL | `tests/base-components.test.tsx` | 14 | **PASSED** (268ms) |
| **Expandable Tabs** | Vitest + RTL | `tests/expandable-tabs.test.ts` | 14 | **PASSED** (326ms) |
| **Sidebar Navigation** | Vitest + RTL | `tests/sidebar.test.ts` | 9 | **PASSED** (393ms) |
| **Login & Auth Flow** | Vitest + Mock Auth | `tests/login-auth.test.ts` | 11 | **PASSED** (46ms) |
| **Environment Configuration** | Vitest | `tests/env.test.ts` | 3 | **PASSED** (6ms) |
| **API Health & Connectivity** | Vitest | `tests/health.test.ts` | 2 | **PASSED** (57ms) |
| **Deterministic Rule Engine** | Vitest | `tests/engine.test.ts` | 16 | **PASSED** (21ms) |
| **Golden Set Evaluation** | Vitest + YAML | `tests/golden/eval.test.ts` | 53 | **PASSED** (28ms) |
| **Data Layer & Triggers** | Vitest + `pg-mem` | `tests/s1-data.test.ts` | 10 | **PASSED** (2.06s) |
| **Intake & Check Pipeline** | Vitest | `tests/s3-intake.test.ts` | 6 | **PASSED** (2.61s) |
| **Decisions & Guidelines** | Vitest + `pg-mem` | `tests/s4-decisions.test.ts` | 8 | **PASSED** (3.50s) |
| **Insights Aggregations** | Vitest + `pg-mem` | `tests/s6-insights.test.ts` | 3 | **PASSED** (1.76s) |
| **Security & Hardening** | Vitest | `tests/s7-security.test.ts` | 5 | **PASSED** (265ms) |
| **Optimistic Hook Core** | Vitest + jsdom | `tests/optimistic-hook.test.ts` | 10 | **PASSED** (36ms) |
| **Optimistic API & Idempotency** | Vitest + `pg-mem` | `tests/optimistic-api.test.ts` | 7 | **PASSED** (184ms) |
| **Reset Demo Endpoint** | Vitest + `pg-mem` | `tests/reset-demo.test.ts` | 3 | **PASSED** (2.15s) |
| **Stale-Content Re-Audit** | Vitest + `pg-mem` | `tests/stale-audit.test.ts` | 2 | **PASSED** (2.90s) |
| **Guideline-Gap Detector** | Vitest + `pg-mem` | `tests/guideline-gap.test.ts` | 2 | **PASSED** (2.92s) |
| **Quick Check Engine** | Vitest | `tests/quick-check.test.ts` | 3 | **PASSED** (12ms) |
| **Upload Extraction Pipeline** | Vitest | `tests/upload-extraction-pipeline.test.ts` | 9 | **PASSED** (412ms) |
| **Apply Suggestion Integration** | Vitest + `pg-mem` | `tests/apply-suggestion.test.ts` | 6 | **PASSED** (5.03s) |
| **Total Test Suites & Tests** | - | - | **23 Suites / 221 Tests** | **100% PASS** |

---

## 2. Optimistic UI & Governance E2E Suite (Playwright)

Executed via `frontend/e2e/optimistic-ui.spec.ts` against headless Chromium (14 tests passed, 21.3s):

| Test Case | Verification Criteria | Status | Measured Latency |
|---|---|---|---|
| **1. Optimistic comment addition** | Text and `Saving…` badge appear immediately (<100ms render); reconciles to 1 item without duplicates when delayed 1.5s server returns | **PASSED** | < 100ms render |
| **2. 500 Rollback with input restoration** | Reverts optimistic comment; displays Paper Brutalist `role="alert"`; restores user typed text into `<input>` | **PASSED** | Immediate rollback (< 50ms) |
| **3. 403 Forbidden handling** | Reverts optimistic state; displays plain language "You don't have permission to do this." | **PASSED** | Immediate rollback |
| **4. Negative Governance Gate: Approval** | Content approval NEVER shows "Approved" early; button maintains `aria-busy="true"` and "Approving…" | **PASSED** | Governance gate verified |
| **5. Offline handling (`context.setOffline`)** | Dispatches offline error; displays "You're offline. This wasn't saved."; input preserved; clicking Retry online saves comment | **PASSED** | Network isolation verified |
| **6. In-flight Deduplication** | Rapid double-click / rapid Enter dispatch sends exactly one request to the server | **PASSED** | In-flight guard verified |
| **7. Navigate mid-flight safety** | Navigating away mid-flight aborts in-flight request cleanly; returning reveals no corrupted or orphaned state | **PASSED** | Lifecycle cleanup verified |
| **8. Sequence Preservation** | Two consecutive comments retain strictly correct top-to-bottom descending chronological order | **PASSED** | Monotonic seq verified |
| **9. Standard Plain-Language HTTP Errors** | Standardized plain-language messages verified for 401, 404, 409, 422, and 429 (`Retry-After`) | **PASSED** | Plain language verified |
| **10. Negative Governance: Dismiss finding** | Blocker dismissal delayed 1.5s NEVER shows dismissed early; 409 keeps finding open with server reason | **PASSED** | Blocker gate verified |
| **11. Negative Governance: Apply suggestion** | Delayed 1.5s NEVER shows v2 early; 409 retains v1 with server conflict reason | **PASSED** | Versioning gate verified |
| **12. Negative Governance: Submit for review** | Delayed 1.5s NEVER shows `in_review` badge early; 409 keeps status draft | **PASSED** | State transition verified |
| **13. Negative Governance: Request changes & Reject** | Delayed 1.5s NEVER shows decision early; 409 retains unapproved status with server reason | **PASSED** | Human gate verified |
| **14. Negative Governance: Publish rule set** | Delayed 1.5s NEVER shows active early; 409 retains draft state with server reason | **PASSED** | Atomic activation verified |

### Performance & Bundle Metrics (Real Measured Numbers)
- **React Internal Optimistic Render Delta (20-run benchmark):**
  - Median: **13.35 ms** (Min: 2.7 ms, Max: 17.3 ms, P95: 16.8 ms)
  - Method: High-resolution in-browser `performance.now()` measuring the delta between button click dispatch and React `requestAnimationFrame` DOM commit.
- **End-to-End User Dispatch + Click Protocol Latency (20-run benchmark):**
  - Median: **256.80 ms** (Min: 160.8 ms, Max: 281.5 ms)
  - Method: Full CDP Playwright click hit-test dispatch to MutationObserver text insertion.
- **Hook Bundle Impact (`useOptimisticMutation.ts`):**
  - Raw Minified JS: **10,161 bytes** (9.92 KB)
  - Gzip Compressed: **3,152 bytes** (3.08 KB)
  - Brotli Compressed: **2,724 bytes** (2.66 KB)
  - Method: `esbuild v0.25` ESM bundle with `--minify`, React externalized, compressed via `node:zlib`.

---

## 3. Golden Set Benchmark Evaluation (Stage S7 & Round 3 Expansion)

Evaluated across 52 labelled test documents (`frontend/tests/golden/labels.yaml`) encompassing superlatives, guarantees, banned terms, casing errors, excessive punctuation, high pressure, competitor comparisons, confidential codename leaks, accessibility violations, adversarial formatting (spaced percent symbols, number formats like "40 percent"), near-miss descriptive adjectives, compound multi-issue copy, prompt injections, XSS injections, and clean compliant copy:

```
================ GOLDEN SET BENCHMARK RESULTS ================
Total Cases:     52
True Positives:  45
False Positives: 1
False Negatives: 0
Precision:       97.83% (Target >= 90%)
Recall:          100.00% (Target >= 90%)
F1-Score:        98.90%
==============================================================
```

### Breakdown of Benchmark Findings & Analysis:
- **True Positives (45):** Accurately caught every violation across Tone, Terminology, Claim, Fact Proximity, Confidentiality, and Accessibility.
- **False Negatives (0):** Zero missed violations across the 52 cases (100.00% Recall).
- **False Positives (1):** One documented false positive in compound Case 19 (`best and guarantee 45% savings`). The sliding 40-character context window for `NUM-001` overlapped with the guarantee phrase token, creating an adjacent flag.
- **Adversarial Formatting Resilience:** Cases 21 and 22 verify that spaced percentages (`35 %`) and worded percentages (`40 percent`) are normalized and evaluated without bypassing numeric bounds.
- **Negative Control Invariance:** All clean control copies (Cases 14, 15, 16, 20, 23, 27, 28, 31, 33, 35, 37, 41, 44, 52) produced exactly 0 findings.

### Note on Golden Set Construction & Overfitting Safeguards:
The 52-case golden set was constructed by combining standard marketing copy permutations with adversarial stress tests: number format variations (e.g. '40 percent' vs '40 %'), spaced percentages, paraphrased superlatives ('#1', 'world-class', 'only'), unverified guarantees ('risk-free', '100%'), multi-issue compound sentences, and clean negative controls.
*Risk of Overfitting:* Because the golden cases are authored against Brightway Solar's specific domain rules, static test sets carry a risk of overfitting to anticipated phrasing patterns. To counteract this, Inkloom Guardian integrates a live "Paste Any Copy" dual-engine analyzer and an optional Gemini AI advisory adapter to surface unmodeled risks in arbitrary unseen text.

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

---

## 5. Paper Brutalist WCAG AA Contrast Verification (Stage F5)

All token pairings across the Design System v2 have been measured against WCAG 2.1 AA/AAA contrast ratios:

| Token Pair | Foreground | Background | Contrast Ratio | WCAG Compliance |
|---|---|---|---|---|
| **Body Text on Paper** | `--ink` (`#0A0A0A`) | `--paper` (`#F4F3EE`) | **18.5:1** | **AAA** (Pass) |
| **Body Text on Surface** | `--ink` (`#0A0A0A`) | `--surface` (`#FBFAF6`) | **19.5:1** | **AAA** (Pass) |
| **Secondary Text on Paper** | `--ink-2` (`#4A4A45`) | `--paper` (`#F4F3EE`) | **7.8:1** | **AAA** (Pass) |
| **Muted Metadata on Paper** | `--ink-3` (`#6B6B64`) | `--paper` (`#F4F3EE`) | **4.8:1** | **AA** (Pass) |
| **Accent Text on Button** | `--accent-ink` (`#FFFFFF`) | `--accent` (`#2D2AE8`) | **5.6:1** | **AA** (Pass) |
| **Blocker Badge Text** | `--ink` (`#0A0A0A`) | `--severity-blocker` (`#FF6B5E`) | **6.9:1** | **AA** (Pass) |
| **Major Badge Text** | `--ink` (`#0A0A0A`) | `--severity-major` (`#FFC93C`) | **12.5:1** | **AAA** (Pass) |
| **Minor Badge Text** | `--ink` (`#0A0A0A`) | `--severity-minor` (`#9CC2FF`) | **11.0:1** | **AAA** (Pass) |
| **Info Badge Text** | `--ink` (`#0A0A0A`) | `--severity-info` (`#E4E2DA`) | **14.5:1** | **AAA** (Pass) |
| **Approved Status Text** | `--ink` (`#0A0A0A`) | `--status-approved` (`#86E3A9`) | **13.0:1** | **AAA** (Pass) |

