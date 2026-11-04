# Phase A Implementation Plan — Inkloom Guardian

## 1. Context & Interview Requirements
- **Users**: Creators (Asha, Ben) submit and revise content; Reviewers (Priya) audit findings and decide; Managers (Marcus) maintain rules, glossary, facts, and inspect insights.
- **6 Interview Asks**:
  1. Exact rule + source citation on every finding.
  2. Exact-version immutable audit trail.
  3. Formally versioned rule sets (v1, v2, v3).
  4. Zero automated approvals (AI/engine never approves).
  5. Stale-content detection (editing invalidates approval until re-checked).
  6. Enforced human control (final gate is human decision).
- **Competitor Landscape**: Lytho, Bynder, and Adobe Brand Concierge provide digital asset management and static style guides, but lack deterministic line-by-line rule citations, fact verification, and cryptographic audit trails.
- **Inkloom Guardian Differentiator**: Granular cited findings linked to guideline section excerpts, exact-version cryptographic audit logging, and an unbypassable human decision gate with blocker enforcement.

## 2. Phase A Scope & Must-Haves
1. **Demo Roles**: Creator Asha, Creator Ben, Reviewer Priya, Manager Marcus with role-based visibility and actions per Auth.md.
2. **Brand Knowledge Base Viewer/Editor**: Sources (S1–S4), active rule set v3, archived v1/v2, glossary, facts, and "Publish vN" workflow.
3. **Content Intake**: Text paste, .txt/.md upload (FileReader), image upload (preview + alt-text accessibility check), clear notice for unsupported formats (.docx/.pdf).
4. **Local Deterministic Rule Engine**: Pure JS rule evaluator for tone, terminology, claims, facts (NUM-001 windowed unit matching), confidentiality, accessibility.
5. **Review Workspace**: Highlighted spans with severity underlines, interactive finding cards with guideline excerpts, suggestion applicator (new append-only version), and filter controls.
6. **Human Decision Workflow**: Submit for review, approve / request changes / reject, blocker gate enforcement, and self-approval prevention.
7. **Audit Log**: Immutable append-only log recording actor, action, content hash (SHA-256), and rule-set version with CSV export.
8. **Insights Dashboard**: Real-time computed metrics for top violated rules, weekly category trends, frequently overridden rules, and median approval time.
9. **Public Pages**: Landing with demo role switchers, About AI disclosure, Build Notes with deviation ledger, and Public Sample Report.
10. **Self-Test Suite**: In-browser test runner verifying the 15 required automated test scenarios.

## 3. Screen & Button Specifications
1. **Landing (`#/`)**:
   - "Try Demo (Asha - Creator)": Switch active session to Asha and route to Dashboard.
   - "Try Demo (Ben - Creator)": Switch active session to Ben and route to Dashboard.
   - "Try Demo (Priya - Reviewer)": Switch active session to Priya and route to Dashboard.
   - "Try Demo (Marcus - Manager)": Switch active session to Marcus and route to Dashboard.
   - "View Public Sample Report": Navigate to `#/demo-report`.
   - "About AI & Architecture": Navigate to `#/about-ai`.
   - "Build Notes": Navigate to `#/build-notes`.
2. **Dashboard (`#/app/dashboard`)**:
   - "New Content": Navigate to `#/app/new`.
   - Row Click / "Open": Navigate to `#/app/content/:id`.
   - Role Filter Tabs ("All", "Needs Action", "Mine"): Filter content list.
3. **New Content (`#/app/new`)**:
   - Tab "Paste Text" / Tab "Upload File": Toggle intake mode.
   - "Upload File" Input: Parse `.txt`/`.md` or show unsupported notice for `.docx`/`.pdf`.
   - "Image File" Input: Attach image preview and reveal Image Alt-Text input.
   - "Save & Check": Create content item (v1), compute SHA-256, execute local rule engine, append audit log, navigate to Review Workspace.
4. **Review Workspace (`#/app/content/:id`)**:
   - "Check Again": Re-run rule engine on current version text, record review run, refresh findings.
   - "Submit for Review": Transition status from `checked` to `in_review` (requires completed check on latest version).
   - Finding Card "Apply Suggestion": Replace quoted slice in text, create new version (vN+1), mark status "checked" / "needs re-check", write audit row.
   - Finding Card "Dismiss" / "Override": Open modal, require reason >= 10 chars, transition finding to dismissed/overridden (blockers require Reviewer/Manager).
   - Finding Card "Open Source": Display popover with exact document title and section text excerpt.
   - Decision Bar "Approve": Open confirm dialog; disabled if blockers open, check stale, or user is author.
   - Decision Bar "Request Changes": Open modal with required feedback note, transition to `changes_requested`.
   - Decision Bar "Reject": Open modal with required feedback note, transition to `rejected`.
   - Tabs "Findings", "Comments", "History", "Audit": Toggle bottom/side panels.
   - Version Selector: Switch view to inspect previous versions (read-only).
5. **Guidelines (`#/app/guidelines`)**:
   - Tabs "Sources", "Rules", "Glossary", "Facts", "Rule Sets".
   - Rule Toggle (Manager only): Enable/disable rule in draft rule set.
   - Rule Edit (Manager only): Change severity and explanation in draft rule set.
   - "Publish vN" (Manager only): Validate draft, activate new version, archive previous active version, write audit record.
   - "Add Glossary Term" / "Add Fact" (Manager only): Add verified term or fact.
6. **Insights (`#/app/insights`)**:
   - "Toggle Data Table / Chart": Switch between graphical bar representation and accessible data table for each of the 4 metrics.
7. **Audit Log (`#/app/audit`)**:
   - Filter dropdowns (Action, User).
   - Row click: Expand full details (SHA-256 content hash, rule-set version, timestamp, metadata).
   - "Export CSV" (Manager only): Generate and download browser CSV file.
8. **About AI (`#/about-ai`)**:
   - Nav links back to app or landing.
9. **Sample Report (`#/demo-report`)**:
   - Read-only public showcase with interactive tabs (Content, Findings, Version History, Audit Trail).
10. **Build Notes (`#/build-notes`)**:
    - Comprehensive submission documentation, live feature matrix, deviation ledger, Round 3 roadmap, and team credits.
11. **Self-Test (`#/selftest`)**:
    - "Run All Self-Tests": Execute 15 automated test cases, display pass/fail badges, logs, and execution times.

## 4. Key Assumptions
1. Single-file architecture (`index.html`) contains all HTML, CSS, and vanilla JS with zero external network requests, functioning 100% offline.
2. Web Crypto API (`crypto.subtle.digest`) is prioritized for SHA-256 hashing, backed by a compact pure-JS SHA-256 implementation ensuring compatibility across restricted browser sandboxes.
3. Storage uses `localStorage` key `inkloom_guardian_v1` with automatic memory fallback and clear user notification if storage access is restricted.
