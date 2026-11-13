import { Finding, ApprovedFactItem } from './types';
import { CANONICAL_FACTS } from './constants';

export const DEFAULT_FACTS: ApprovedFactItem[] = CANONICAL_FACTS.map((cf, idx) => ({
  id: `60000000-0000-0000-0000-00000000000${idx + 1}`,
  key: cf.key,
  statement: cf.statement,
  values: cf.values,
  unit: cf.unit,
  keywords: cf.keywords,
}));

export function normaliseUnit(rawUnit: string): string | null {
  const u = rawUnit.toLowerCase().trim();
  if (u === '%' || u === 'percent' || u === 'percentage') return '%';
  if (u === 'year' || u === 'years' || u === '-year' || u === 'yr' || u === 'yrs') return 'years';
  if (u === 'day' || u === 'days' || u === '-day') return 'days';
  if (u === 'city' || u === 'cities') return 'cities';
  return null;
}

export interface ParsedNumberClaim {
  fullMatch: string;
  start: number;
  end: number;
  min: number;
  max: number;
  unit: string;
}

/**
 * Extracts numbers with units, ranges, and hyphens from text
 */
export function extractNumberClaims(text: string): ParsedNumberClaim[] {
  const claims: ParsedNumberClaim[] = [];

  // Pattern matches:
  // "18-24%", "18–24 %", "1 to 2 days", "25-year", "22.5 %", "40 percent"
  const regex = /(\b\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(%|percent|years?|-year|days?|-day|cities|city)(?!\w)|(\b\d+(?:\.\d+)?)\s*(%|percent|years?|-year|days?|-day|cities|city)(?!\w)/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && match[2] && match[3]) {
      // Range: $1 to $2 with unit $3
      const unit = normaliseUnit(match[3]);
      if (unit) {
        claims.push({
          fullMatch: match[0],
          start: match.index,
          end: match.index + match[0].length,
          min: parseFloat(match[1]),
          max: parseFloat(match[2]),
          unit,
        });
      }
    } else if (match[4] && match[5]) {
      // Single value: $4 with unit $5
      const unit = normaliseUnit(match[5]);
      if (unit) {
        const val = parseFloat(match[4]);
        claims.push({
          fullMatch: match[0],
          start: match.index,
          end: match.index + match[0].length,
          min: val,
          max: val,
          unit,
        });
      }
    }
  }

  return claims;
}

/**
 * Checks number claims against approved facts using a ±80 character context window.
 */
export function checkNumberClaims(
  text: string,
  approvedFacts: ApprovedFactItem[] = DEFAULT_FACTS,
  ruleSetVersion: number = 3
): Finding[] {
  const findings: Finding[] = [];
  const claims = extractNumberClaims(text);

  for (const claim of claims) {
    // ±80 character window around claim
    const windowStart = Math.max(0, claim.start - 80);
    const windowEnd = Math.min(text.length, claim.end + 80);
    const windowText = text.slice(windowStart, windowEnd).toLowerCase();

    // Find candidate facts with matching unit
    const unitFacts = approvedFacts.filter((f) => f.unit === claim.unit);

    interface ScoredFact {
      fact: ApprovedFactItem;
      matches: number;
      isSupported: boolean;
      minDistance: number;
    }

    const scored: ScoredFact[] = [];

    for (const fact of unitFacts) {
      let matches = 0;
      let minDistance = 9999;
      for (const kw of fact.keywords) {
        const kwRegex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = kwRegex.exec(windowText)) !== null) {
          matches++;
          const absIdx = windowStart + m.index;
          const dist = Math.abs(absIdx - claim.start);
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
      }

      if (matches > 0) {
        const factVal = fact.values[0];
        let isSupported = false;
        if (factVal) {
          const factMin = factVal.min ?? 0;
          const factMax = factVal.max ?? factVal.value ?? 0;
          if (claim.min >= factMin && claim.max <= factMax) {
            isSupported = true;
          }
        }
        scored.push({ fact, matches, isSupported, minDistance });
      }
    }

    if (scored.length === 0) {
      // No approved fact in window -> Major finding
      findings.push({
        id: `finding-num-major-${claim.start}`,
        ruleKey: 'NUM-001',
        ruleTitle: 'Unsupported figures or metrics',
        ruleSetVersion,
        sourceDoc: 'Approved Facts Sheet 2025-Q3',
        sourceSection: '1',
        origin: 'rule',
        category: 'fact',
        severity: 'major',
        spanStart: claim.start,
        spanEnd: claim.end,
        quote: claim.fullMatch,
        explanation: 'No approved fact supports this figure.',
        confidence: 1.0,
        status: 'open',
      });
      continue;
    }

    // Sort scored candidates:
    // 1. Highest match count
    // 2. Value supported status (prefer supported facts when tied on matches)
    // 3. Proximity to claim (lower minDistance)
    scored.sort((a, b) => {
      if (b.matches !== a.matches) return b.matches - a.matches;
      if (b.isSupported !== a.isSupported) return b.isSupported ? 1 : -1;
      return a.minDistance - b.minDistance;
    });

    const best = scored[0];
    const matchedFact = best.fact;

    // A fact was matched. Check if the claimed value/range is supported.
    const factVal = matchedFact.values[0];
    const isSupported = best.isSupported;

    if (!isSupported) {
      const expectedStr = factVal.min !== undefined && factVal.max !== undefined
        ? `${factVal.min}–${factVal.max}${factVal.unit}`
        : `${factVal.value}${factVal.unit}`;

      const claimedStr = claim.min === claim.max
        ? `${claim.min}${claim.unit}`
        : `${claim.min}–${claim.max}${claim.unit}`;

      findings.push({
        id: `finding-num-blocker-${claim.start}`,
        ruleKey: 'NUM-001',
        ruleTitle: 'Unsupported figures or metrics',
        ruleSetVersion,
        sourceDoc: 'Approved Facts Sheet 2025-Q3',
        sourceSection: '1',
        origin: 'rule',
        category: 'fact',
        severity: 'blocker',
        spanStart: claim.start,
        spanEnd: claim.end,
        quote: claim.fullMatch,
        explanation: `Approved figure is ${expectedStr}; ${claimedStr} is not supported (${matchedFact.key}).`,
        suggestion: expectedStr,
        confidence: 1.0,
        status: 'open',
      });
    }
  }

  return findings;
}
