import { Finding, EngineContext } from './types';
import { checkNumberClaims } from './num001';
import { deduplicateAndRankFindings } from './dedup';

interface PatternRule {
  key: string;
  category: any;
  severity: any;
  title: string;
  sourceDoc: string;
  sourceSection: string;
  explanation: string;
  regex: RegExp;
  getSuggestion?: (match: string) => string | undefined;
}

const STATIC_PATTERN_RULES: PatternRule[] = [
  // TONE-002 · tone · major · pressure phrases
  {
    key: 'TONE-002',
    category: 'tone',
    severity: 'major',
    title: 'High-pressure phrase',
    sourceDoc: 'Brand Voice Guide',
    sourceSection: '2.3',
    explanation: 'High-pressure urgency phrases diminish brand trust and violate our helpful tone.',
    regex: /\b(act now|limited time only|don't miss out|hurry|last chance)\b/gi,
  },
  // TONE-003 · tone · minor · hype words
  {
    key: 'TONE-003',
    category: 'tone',
    severity: 'minor',
    title: 'Exaggerated hype word',
    sourceDoc: 'Brand Voice Guide',
    sourceSection: '2.4',
    explanation: 'Overstated hype words weaken customer confidence in our engineering rigor.',
    regex: /\b(revolutionary|game-changing|unbelievable|amazing|mind-blowing)\b/gi,
  },
  // TERM-002 · terminology · minor · product name must be written "SunLink"
  {
    key: 'TERM-002',
    category: 'terminology',
    severity: 'minor',
    title: 'Incorrect product name formatting',
    sourceDoc: 'Terminology Sheet',
    sourceSection: '2',
    explanation: 'Product name must always be formatted in camel case as "SunLink".',
    regex: /\b(Sun Link|Sunlink|SUNLINK|sun-link)\b/g,
    getSuggestion: () => 'SunLink',
  },
  // MSG-001 · messaging · major · comparative claims
  {
    key: 'MSG-001',
    category: 'messaging',
    severity: 'major',
    title: 'Comparative messaging claim',
    sourceDoc: 'Brand Voice Guide',
    sourceSection: '4.1',
    explanation: 'Direct comparative claims create legal liability and contradict our respectful brand posture.',
    regex: /\b(better than|cheaper than|unlike other|beats)\b/gi,
  },
  // CLAIM-001 · claim · blocker · superlatives
  {
    key: 'CLAIM-001',
    category: 'claim',
    severity: 'blocker',
    title: 'Unsubstantiated superlative',
    sourceDoc: 'Brand Voice Guide',
    sourceSection: '5.2',
    explanation: 'Superlatives must be backed by documented third-party verification.',
    regex: /(?:\b(best|number one|fastest|leading|unbeatable|world-class|only)\b|(?:\b|(?<=[\s]))#1\b)/gi,
  },
  // CLAIM-002 · claim · blocker · guarantee language
  {
    key: 'CLAIM-002',
    category: 'claim',
    severity: 'blocker',
    title: 'Absolute guarantee language',
    sourceDoc: 'Brand Voice Guide',
    sourceSection: '5.3',
    explanation: 'Absolute guarantee statements create legal liability. Reference standard warranty terms instead.',
    regex: /\b(guarantee|guaranteed|risk-free)\b|(?:100%|\b100\s*%(?!\w))/gi,
  },
  // CONF-001 · confidentiality · blocker · internal names & emails
  {
    key: 'CONF-001',
    category: 'confidentiality',
    severity: 'blocker',
    title: 'Confidential information',
    sourceDoc: 'Brand Voice Guide',
    sourceSection: '7',
    explanation: 'Internal project codenames and email addresses must not appear in public materials.',
    regex: /\b(Project Helios|Project Apollo|unreleased|internal only|do not share)\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi,
  },
  // ACC-002 · accessibility · minor · link-style text alone
  {
    key: 'ACC-002',
    category: 'accessibility',
    severity: 'minor',
    title: 'Non-descriptive link copy',
    sourceDoc: 'Accessibility & Asset Policy',
    sourceSection: '1.3',
    explanation: 'Vague link copy like "click here" fails accessibility standards for screen reader navigation.',
    regex: /\b(click here|read more|learn more)\b/gi,
  },
];

const DEFAULT_GLOSSARY_MAPPING = [
  { term: 'cheapest', kind: 'banned' as const, alt: 'affordable', sev: 'major' as const },
  { term: 'free energy', kind: 'banned' as const, alt: 'clean energy', sev: 'major' as const },
  { term: 'zero bills', kind: 'banned' as const, alt: 'lower bills', sev: 'major' as const },
  { term: 'solar cells', kind: 'banned' as const, alt: 'solar panels', sev: 'major' as const },
  { term: 'users', kind: 'discouraged' as const, alt: 'customers', sev: 'info' as const },
  { term: 'green', kind: 'discouraged' as const, alt: 'renewable', sev: 'info' as const },
];

/**
 * Runs the deterministic local rule engine on the input text.
 * Never throws — on unexpected runtime error, returns safe fallback.
 */
export function runRules(text: string, ctx: EngineContext = {}): Finding[] {
  try {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const version = ctx.ruleSetVersion ?? 3;
    const rawFindings: Finding[] = [];

    // 1. TONE-001: 2+ exclamation marks in a row OR > 1 "!" per 60 words
    const multiExclRegex = /!{2,}/g;
    let m: RegExpExecArray | null;
    while ((m = multiExclRegex.exec(text)) !== null) {
      rawFindings.push({
        id: `finding-tone001-${m.index}`,
        ruleKey: 'TONE-001',
        ruleTitle: 'Excessive punctuation',
        ruleSetVersion: version,
        sourceDoc: 'Brand Voice Guide',
        sourceSection: '2.1',
        origin: 'rule',
        category: 'tone',
        severity: 'minor',
        spanStart: m.index,
        spanEnd: m.index + m[0].length,
        quote: m[0],
        explanation: 'Two or more exclamation marks in a row violate our measured voice.',
        suggestion: '.',
        confidence: 1.0,
        status: 'open',
      });
    }

    // Exclamation density check: > 1 "!" per 60 words
    const words = text.trim().split(/\s+/).filter(Boolean);
    const exclamationCount = (text.match(/!/g) || []).length;
    if (words.length >= 60 && exclamationCount > Math.floor(words.length / 60)) {
      // Find single exclamation marks
      const singleExclRegex = /(?<!\!)!(?!\!)/g;
      while ((m = singleExclRegex.exec(text)) !== null) {
        rawFindings.push({
          id: `finding-tone001-density-${m.index}`,
          ruleKey: 'TONE-001',
          ruleTitle: 'Excessive punctuation density',
          ruleSetVersion: version,
          sourceDoc: 'Brand Voice Guide',
          sourceSection: '2.1',
          origin: 'rule',
          category: 'tone',
          severity: 'minor',
          spanStart: m.index,
          spanEnd: m.index + 1,
          quote: '!',
          explanation: 'More than one exclamation mark per 60 words violates our measured voice.',
          suggestion: '.',
          confidence: 1.0,
          status: 'open',
        });
      }
    }

    // 2. TERM-001: Glossary terms check
    const glossary = ctx.glossary || DEFAULT_GLOSSARY_MAPPING.map((g) => ({
      term: g.term,
      kind: g.kind,
      preferredAlternative: g.alt,
    }));

    for (const g of glossary) {
      const escaped = g.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const gRegex = new RegExp(`\\b${escaped}\\b`, 'gi');
      while ((m = gRegex.exec(text)) !== null) {
        const severity = g.kind === 'discouraged' ? 'info' : 'major';
        rawFindings.push({
          id: `finding-term001-${m.index}`,
          ruleKey: 'TERM-001',
          ruleTitle: g.kind === 'banned' ? 'Banned terminology' : 'Discouraged terminology',
          ruleSetVersion: version,
          sourceDoc: 'Terminology Sheet',
          sourceSection: '1',
          origin: 'rule',
          category: 'terminology',
          severity,
          spanStart: m.index,
          spanEnd: m.index + m[0].length,
          quote: m[0],
          explanation: `The term "${m[0]}" is ${g.kind}. Use "${g.preferredAlternative || 'approved terminology'}" instead.`,
          suggestion: g.preferredAlternative,
          confidence: 1.0,
          status: 'open',
        });
      }
    }

    // 3. Static Pattern Rules (TONE-002, TONE-003, TERM-002, MSG-001, CLAIM-001, CLAIM-002, CONF-001, ACC-002)
    for (const rule of STATIC_PATTERN_RULES) {
      rule.regex.lastIndex = 0;
      while ((m = rule.regex.exec(text)) !== null) {
        rawFindings.push({
          id: `finding-${rule.key.toLowerCase()}-${m.index}`,
          ruleKey: rule.key,
          ruleTitle: rule.title,
          ruleSetVersion: version,
          sourceDoc: rule.sourceDoc,
          sourceSection: rule.sourceSection,
          origin: 'rule',
          category: rule.category,
          severity: rule.severity,
          spanStart: m.index,
          spanEnd: m.index + m[0].length,
          quote: m[0],
          explanation: rule.explanation,
          suggestion: rule.getSuggestion ? rule.getSuggestion(m[0]) : undefined,
          confidence: 1.0,
          status: 'open',
        });
      }
    }

    // 4. ACC-003: Runs of 4+ consecutive ALL-CAPS words
    const allCapsRegex = /\b[A-Z]{2,}(?:\s+[A-Z]{2,}){3,}\b/g;
    while ((m = allCapsRegex.exec(text)) !== null) {
      rawFindings.push({
        id: `finding-acc003-${m.index}`,
        ruleKey: 'ACC-003',
        ruleTitle: 'Excessive uppercase text',
        ruleSetVersion: version,
        sourceDoc: 'Accessibility & Asset Policy',
        sourceSection: '1.5',
        origin: 'rule',
        category: 'accessibility',
        severity: 'minor',
        spanStart: m.index,
        spanEnd: m.index + m[0].length,
        quote: m[0],
        explanation: 'Runs of 4 or more ALL-CAPS words are difficult to read and degrade accessibility.',
        confidence: 1.0,
        status: 'open',
      });
    }

    // 5. ACC-001: Image alt text validation
    if (ctx.imageAltText !== undefined) {
      const alt = ctx.imageAltText.trim();
      if (!alt || alt.length < 5) {
        rawFindings.push({
          id: 'finding-acc001-alt',
          ruleKey: 'ACC-001',
          ruleTitle: 'Image missing descriptive alt text',
          ruleSetVersion: version,
          sourceDoc: 'Accessibility & Asset Policy',
          sourceSection: '1.1',
          origin: 'rule',
          category: 'accessibility',
          severity: 'major',
          spanStart: 0,
          spanEnd: 0,
          quote: '[Image without alt text]',
          explanation: 'All images require descriptive alternative text of at least 5 characters.',
          confidence: 1.0,
          status: 'open',
        });
      }
    }

    // 6. NUM-001: Approved facts & numbers check
    const numFindings = checkNumberClaims(text, ctx.facts, version);
    rawFindings.push(...numFindings);

    // 7. De-duplicate overlapping spans, sort by severity and position, cap at 50
    return deduplicateAndRankFindings(rawFindings, text, 50);
  } catch (err) {
    console.error('Local rule engine encountered an unexpected error:', err);
    return [];
  }
}
