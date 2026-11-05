PASTE THE TEXT BELOW THE LINE INTO YOUR VS CODE AGENT.
Do not paste the next phase until the agent's report shows every check PASSED with real command output.

----------------------------------------

# S2 — The engine (pure TypeScript, test-first)
In `lib/engine/` implement and unit-test:
- `runRules(text, ctx)` for all 13 rules in the seed pack, Unicode-safe word boundaries, de-duplication of overlapping spans (higher severity wins), stable ordering, cap 50, never throws on weird input (empty, 100k chars, emoji, RTL).
- NUM-001 exactly as specified in `ANTIGRAVITY_PROMPT.md` (units, ranges, ±80-char keyword window, supported/unsupported/major rules).
- `redact()/restore()` with offset mapping; `validateAiFindings()` implementing Agents.md A4 (unknown keys, non-substring quotes, bad severity, duplicates, suggestion that violates a blocker rule, cap); `diffWords()`; `sha256()`.
- Property test: for random text, every finding satisfies `text.slice(start,end) === quote`.
- Put the 15 test cases from the Tester section of `ANTIGRAVITY_PROMPT.md` that apply to the engine into `tests/unit/engine.spec.ts` (expected results are given there; keep them verbatim).
Acceptance: all engine tests pass; `runRules` on a 2,000-word text runs in < 200 ms (show timing).
