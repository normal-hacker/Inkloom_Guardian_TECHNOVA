import { Finding, Severity } from './types';

const SEVERITY_WEIGHT: Record<Severity, number> = {
  blocker: 4,
  major: 3,
  minor: 2,
  info: 1,
};

/**
 * Validates quotes against original text offsets, de-duplicates overlapping spans,
 * sorts by severity and position, and caps at 50 findings.
 */
export function deduplicateAndRankFindings(
  findings: Finding[],
  originalText: string,
  cap: number = 50
): Finding[] {
  // 1. Validate quote grounding: text.slice(start, end) === quote
  const groundedFindings = findings.filter((f) => {
    // If the finding is an alt text or metadata rule, it might not reference a slice of text_body
    if (f.ruleKey === 'ACC-001') {
      return true;
    }
    const actualSlice = originalText.slice(f.spanStart, f.spanEnd);
    return actualSlice === f.quote;
  });

  // 2. Sort candidates by severity desc, then span start asc, then rule order
  groundedFindings.sort((a, b) => {
    const sevDiff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.spanStart - b.spanStart;
  });

  // 3. Remove overlapping spans (higher severity wins)
  const resolved: Finding[] = [];

  for (const candidate of groundedFindings) {
    if (candidate.ruleKey === 'ACC-001') {
      resolved.push(candidate);
      continue;
    }

    // Check overlap with already accepted findings
    const overlaps = resolved.some((existing) => {
      if (existing.ruleKey === 'ACC-001') return false;
      return (
        candidate.spanStart < existing.spanEnd &&
        candidate.spanEnd > existing.spanStart
      );
    });

    if (!overlaps) {
      resolved.push(candidate);
    }
  }

  // 4. Final sort: severity desc, then spanStart asc
  resolved.sort((a, b) => {
    const sevDiff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.spanStart - b.spanStart;
  });

  // 5. Cap at maximum 50 findings
  return resolved.slice(0, cap);
}
