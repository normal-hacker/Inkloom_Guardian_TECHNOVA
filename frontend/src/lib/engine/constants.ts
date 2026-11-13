/**
 * Single Source of Truth for Governance Rules, Approved Facts, and Severities.
 * Mandatory per § 1.1: landing page, /demo-report, /rules, rule definitions, and seed data
 * ALL import from this module.
 */

export interface CanonicalRule {
  key: string;
  title: string;
  category: 'tone' | 'terminology' | 'message' | 'claim' | 'fact' | 'confidentiality' | 'accessibility';
  severity: 'blocker' | 'major' | 'minor';
  description: string;
  sourceDoc: string;
  sourceSection: string;
}

export interface CanonicalFact {
  key: string;
  statement: string;
  sourceDoc: string;
  sourceSection: string;
  values: Array<{ min?: number; max?: number; value?: number; unit: string }>;
  unit: string;
  keywords: string[];
}

export const CANONICAL_SEVERITIES = {
  'CLAIM-001': 'blocker' as const,
  'CLAIM-002': 'blocker' as const,
  'NUM-001': 'blocker' as const,
  'CONF-001': 'blocker' as const,
  'TERM-001': 'major' as const,
  'TERM-002': 'minor' as const,
  'TONE-001': 'minor' as const,
  'TONE-002': 'minor' as const,
  'TONE-003': 'major' as const,
  'MSG-001': 'minor' as const,
  'ACC-001': 'major' as const,
  'ACC-002': 'major' as const,
  'ACC-003': 'minor' as const,
};

export const CANONICAL_RULES: CanonicalRule[] = [
  {
    key: 'TONE-001',
    title: 'Exclamation mark restraint',
    category: 'tone',
    severity: CANONICAL_SEVERITIES['TONE-001'],
    description: 'Marketing prose must not use more than one exclamation mark per paragraph.',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§2.1',
  },
  {
    key: 'TONE-002',
    title: 'No false urgency',
    category: 'tone',
    severity: CANONICAL_SEVERITIES['TONE-002'],
    description: 'Prohibit artificial urgency expressions such as "act now" or "limited time".',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§2.4',
  },
  {
    key: 'TONE-003',
    title: 'No hype or buzzwords',
    category: 'tone',
    severity: CANONICAL_SEVERITIES['TONE-003'],
    description: 'Prohibit sensationalized hype language such as "revolutionary" or "game-changing".',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§2.6',
  },
  {
    key: 'TERM-001',
    title: 'Prohibited terminology',
    category: 'terminology',
    severity: CANONICAL_SEVERITIES['TERM-001'],
    description: 'Banned terms such as "cheapest" (use "affordable") and "solar cells" (use "solar panels").',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§3.1',
  },
  {
    key: 'TERM-002',
    title: 'Product naming camelCase',
    category: 'terminology',
    severity: CANONICAL_SEVERITIES['TERM-002'],
    description: 'Enforce correct compound capitalization for SunLink and PowerVault.',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§3.3',
  },
  {
    key: 'MSG-001',
    title: 'Customer-first perspective',
    category: 'message',
    severity: CANONICAL_SEVERITIES['MSG-001'],
    description: 'Ensure outward customer benefit framing rather than self-congratulatory company-centric framing.',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§4.1',
  },
  {
    key: 'CLAIM-001',
    title: 'Unsubstantiated superlative claim',
    category: 'claim',
    severity: CANONICAL_SEVERITIES['CLAIM-001'],
    description: 'Prohibit unsupported absolute superlatives ("best on the market", "#1 provider") without third-party audit.',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§5.2',
  },
  {
    key: 'CLAIM-002',
    title: 'Unverified savings or bill guarantee',
    category: 'claim',
    severity: CANONICAL_SEVERITIES['CLAIM-002'],
    description: 'Prohibit absolute guarantee claims ("guarantee zero electric bills") without regulatory underwriting.',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§5.3',
  },
  {
    key: 'NUM-001',
    title: 'Approved metrics & figures check',
    category: 'fact',
    severity: CANONICAL_SEVERITIES['NUM-001'],
    description: 'Validate numerical claims against verified fact sheets (savings range 18–24%, 25-year panel warranty, etc.).',
    sourceDoc: 'Approved Fact Sheet 2025-Q3',
    sourceSection: 'F-001 to F-006',
  },
  {
    key: 'CONF-001',
    title: 'Confidential project names & PII',
    category: 'confidentiality',
    severity: CANONICAL_SEVERITIES['CONF-001'],
    description: 'Block unreleased internal project codenames (Project Helios) and corporate emails/phones in external copy.',
    sourceDoc: 'Confidentiality & Communications Policy 2026',
    sourceSection: '§1.2',
  },
  {
    key: 'ACC-001',
    title: 'Image descriptive alt text',
    category: 'accessibility',
    severity: CANONICAL_SEVERITIES['ACC-001'],
    description: 'All embedded campaign imagery must include meaningful descriptive alt text (at least 5 characters).',
    sourceDoc: 'WCAG 2.1 AA / Internal A11y Standards',
    sourceSection: '1.1.1',
  },
  {
    key: 'ACC-002',
    title: 'Descriptive link text',
    category: 'accessibility',
    severity: CANONICAL_SEVERITIES['ACC-002'],
    description: 'Prohibit ambiguous click targets ("click here", "read more") without surrounding accessible context.',
    sourceDoc: 'WCAG 2.1 AA / Internal A11y Standards',
    sourceSection: '2.4.4',
  },
  {
    key: 'ACC-003',
    title: 'Excessive uppercase text',
    category: 'accessibility',
    severity: CANONICAL_SEVERITIES['ACC-003'],
    description: 'Prohibit 4 or more consecutive uppercase words to preserve readability and screen reader flow.',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§6.2',
  },
];

export const CANONICAL_FACTS: CanonicalFact[] = [
  {
    key: 'F-001',
    statement: 'Average household electricity-bill savings were 18–24% (2025 customer study, n=412)',
    sourceDoc: 'Approved Fact Sheet 2025-Q3',
    sourceSection: 'F-001',
    values: [{ min: 18, max: 24, unit: '%' }],
    unit: '%',
    keywords: ['savings', 'save', 'saving', 'bill', 'bills', 'electricity'],
  },
  {
    key: 'F-002',
    statement: 'Panels carry a 25-year performance warranty',
    sourceDoc: 'Approved Fact Sheet 2025-Q3',
    sourceSection: 'F-002',
    values: [{ value: 25, unit: 'years' }],
    unit: 'years',
    keywords: ['warranty', 'panels', 'performance', 'panel'],
  },
  {
    key: 'F-003',
    statement: 'Typical home installation takes 1–2 days',
    sourceDoc: 'Approved Fact Sheet 2025-Q3',
    sourceSection: 'F-003',
    values: [{ min: 1, max: 2, unit: 'days' }],
    unit: 'days',
    keywords: ['install', 'installation', 'installed'],
  },
  {
    key: 'F-004',
    statement: 'The inverter carries a 12-year warranty',
    sourceDoc: 'Approved Fact Sheet 2025-Q3',
    sourceSection: 'F-004',
    values: [{ value: 12, unit: 'years' }],
    unit: 'years',
    keywords: ['inverter', 'warranty'],
  },
  {
    key: 'F-005',
    statement: 'Panel efficiency is up to 22.5%',
    sourceDoc: 'Approved Fact Sheet 2025-Q3',
    sourceSection: 'F-005',
    values: [{ value: 22.5, unit: '%' }],
    unit: '%',
    keywords: ['efficiency', 'efficient'],
  },
  {
    key: 'F-006',
    statement: 'Brightway Solar serves customers in 14 cities',
    sourceDoc: 'Approved Fact Sheet 2025-Q3',
    sourceSection: 'F-006',
    values: [{ value: 14, unit: 'cities' }],
    unit: 'cities',
    keywords: ['cities', 'serve', 'serves'],
  },
];

export const F001_BENCHMARK = {
  key: 'F-001',
  certifiedBenchmark: '20%',
  certifiedRange: '18–24%',
  certifiedMin: 18,
  certifiedMax: 24,
  sampleUnverifiedQuote: '40% savings',
  sampleApprovedQuote: '20% savings',
  sampleExplanation: 'Approved savings claim is certified at 18–24% (F-001 benchmark: 20%). 40% exceeds verified customer study data.',
  sampleSuggestion: '20% average utility savings',
};

