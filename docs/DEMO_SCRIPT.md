# Inkloom Guardian: 60–90 Second Live Walkthrough Script

**Video Target Duration:** 75 seconds  
**Live Demo URL:** [https://inkloomguardiantechnova.vercel.app](https://inkloomguardiantechnova.vercel.app)  
**Tone:** Confident, technical, concise, governance-focused.

---

### Scene 1: Landing Page & 1-Click Persona Access (00:00 – 00:12)
- **Visual:** Open `https://inkloomguardiantechnova.vercel.app` in incognito. Point cursor to the Paper Brutalist hero section: *"Check before you publish."*
- **Action:** Click the top-right button: **"Try Demo as Reviewer (1-Click)"**. Instantly lands on `/dashboard` as Priya Sharma (Reviewer).
- **Voiceover:**
  > *"This is Inkloom Guardian — an automated brand integrity and governance platform built on Next.js 15 and PostgreSQL. No account setup required: with one click, we're signed in as Priya, our designated brand reviewer."*

---

### Scene 2: Submitting Risky Copy & Instant Deterministic Checking (00:12 – 00:26)
- **Visual:** Navigate to `/content/new`.
- **Action:** Paste draft copy:
  > *"Our revolutionary panels are the best on the market and guarantee 40% savings with Sun Link!"*
- **Action:** Click **"Run Brand Governance Check"**.
- **Voiceover:**
  > *"When an author submits marketing copy, our pure TypeScript deterministic engine evaluates 13 core brand rules locally in under one millisecond — zero external network calls, zero hallucination risk."*

---

### Scene 3: Review Workspace, Exact Citations & 1-Click Suggestions (00:26 – 00:44)
- **Visual:** Review workspace opens (`/content/[id]`). Left pane shows copy with severity underlines (Red blocker for superlative, orange for banned terms, amber for unverified numbers).
- **Action:** Click the highlight on `"best on the market"`. The right pane scrolls to `CLAIM-001` citing *Brand Voice Guide §5.2*.
- **Action:** Click **"Apply Suggestion"** (`"leading residential solar choice"`). The text updates instantly in the editor, creating version v2 with zero mutation.
- **Action:** Repeat for `"Sun Link"` → `"SunLink"` (`TERM-002`) and `"guarantee 40% savings"` → `"up to 20% average utility savings"` (`NUM-001` grounded in Fact `F-001`).
- **Voiceover:**
  > *"Every finding cites the exact brand source document, section, and rule key. Suggestions preserve author intent and can be applied with one click, producing an immutable version snapshot. Notice the blocker gate: content cannot be approved while critical blockers remain open."*

---

### Scene 4: Human Reviewer Approval & Cryptographic Audit Seal (00:44 – 00:58)
- **Visual:** All blockers are resolved. The green **"Approve & Sign Off"** button becomes active.
- **Action:** Priya enters the approval rationale: *"Approved after verifying third-party metrics."* and clicks **Approve**.
- **Action:** Navigate to `/audit` (or view approval seal). Shows the SHA-256 hash `ba7816bf...`, actor email, timestamp, and rule set version v3.
- **Voiceover:**
  > *"Our core ethical policy: the AI never approves content. A human must decide. Upon approval, an immutable cryptographic seal is committed to our append-only PostgreSQL audit ledger with SHA-256 content hashes that reject tampering."*

---

### Scene 5: Stale-Content Re-Audit Pipeline (00:58 – 01:15)
- **Visual:** Navigate to `/guidelines?tab=facts`.
- **Action:** Click the admin simulation button: **"Simulate Fact Update (20% → 15%) & Re-Audit"**.
- **Action:** System updates Fact `F-001`, re-scans all approved campaigns, and flags the approved item.
- **Action:** Click **"View in Dashboard →"**. The dashboard now displays the campaign with a bold **"Needs re-review"** badge and filter tab.
- **Voiceover:**
  > *"Brand rules aren't static. In Round 3, we built the Stale-Content Re-Audit Pipeline: when our savings ceiling updates from 20% to 15%, historical approved campaigns are automatically re-evaluated. Non-compliant copy is flagged for human re-review with the exact fact diff, ensuring old campaigns never silently drift into non-compliance."*

---

### Conclusion (01:15 – 01:20)
- **Visual:** Show `/insights` page with the Guideline-Gap detector and `/selftest` with the 52-case benchmark (98.9% F1).
- **Voiceover:**
  > *"Deterministic rule precision, bounded AI advice, human-sovereign gates, and immutable audit transparency. That is Inkloom Guardian."*

