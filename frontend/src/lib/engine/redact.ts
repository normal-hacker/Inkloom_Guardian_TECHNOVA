export interface RedactionSegment {
  originalStart: number;
  originalEnd: number;
  originalText: string;
  redactedStart: number;
  redactedEnd: number;
  placeholder: string;
}

export interface RedactionResult {
  redactedText: string;
  segments: RedactionSegment[];
}

const DEFAULT_CONFIDENTIAL_TERMS = [
  'Project Helios',
  'unreleased',
  'internal only',
  'do not share',
];

/**
 * Redacts emails, phone numbers, and confidential terms before external LLM calls.
 */
export function redact(
  text: string,
  confidentialTerms: string[] = DEFAULT_CONFIDENTIAL_TERMS
): RedactionResult {
  const matches: Array<{ start: number; end: number; text: string; type: string }> = [];

  // 1. Emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  let match: RegExpExecArray | null;
  while ((match = emailRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'EMAIL',
    });
  }

  // 2. Phone numbers (e.g. 555-123-4567, (555) 123-4567, +1-555-123-4567)
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'PHONE',
    });
  }

  // 3. Confidential terms
  for (const term of confidentialTerms) {
    if (!term) continue;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termRegex = new RegExp(`\\b${escaped}\\b`, 'gi');
    while ((match = termRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: 'CONFIDENTIAL',
      });
    }
  }

  // Sort matches by start offset
  matches.sort((a, b) => a.start - b.start);

  // De-duplicate any overlapping matches
  const nonOverlapping: typeof matches = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.end;
    }
  }

  // Build redacted text and segments
  let redactedText = '';
  let cursor = 0;
  const segments: RedactionSegment[] = [];
  let counter = 1;

  for (const m of nonOverlapping) {
    redactedText += text.slice(cursor, m.start);
    const placeholder = `[${m.type}_${counter++}]`;
    const rStart = redactedText.length;
    redactedText += placeholder;
    const rEnd = redactedText.length;

    segments.push({
      originalStart: m.start,
      originalEnd: m.end,
      originalText: m.text,
      redactedStart: rStart,
      redactedEnd: rEnd,
      placeholder,
    });

    cursor = m.end;
  }
  redactedText += text.slice(cursor);

  return { redactedText, segments };
}

/**
 * Restores an offset or span from redacted coordinate space back to the original text coordinates.
 */
export function restoreOffset(redactedOffset: number, segments: RedactionSegment[]): number {
  let delta = 0;

  for (const seg of segments) {
    if (redactedOffset <= seg.redactedStart) {
      break;
    }
    if (redactedOffset >= seg.redactedEnd) {
      delta += (seg.originalEnd - seg.originalStart) - (seg.redactedEnd - seg.redactedStart);
    } else {
      // Offset fell inside the placeholder
      return seg.originalStart;
    }
  }

  return redactedOffset + delta;
}

export function restoreSpan(
  rStart: number,
  rEnd: number,
  segments: RedactionSegment[]
): { start: number; end: number } {
  return {
    start: restoreOffset(rStart, segments),
    end: restoreOffset(rEnd, segments),
  };
}
