export interface RoadmapItem {
  id: string;
  title: string;
  status: 'Prototype built' | 'Planned' | 'In Research';
  priority: 'P0' | 'P1' | 'P2';
  why: string;
  whatExistsToday: string;
  successMetric: string;
  realWorldScenario: string;
}

export const ROUND_3_ROADMAP: RoadmapItem[] = [
  {
    id: 'stale-re-audit',
    title: 'Stale-Content Re-Audit Pipeline',
    status: 'Prototype built',
    priority: 'P0',
    why: 'Brand guidelines and legal facts evolve over time. Previously approved marketing assets can quietly become illegal or non-compliant when fact baselines shift.',
    whatExistsToday: 'Automated re-audit trigger on fact updates, status transition to "needs_review", audit log ledger events, and dashboard "Stale Approvals" before/after diff inspector.',
    successMetric: '100% of approved content violating updated facts detected; 0 silent overrides; human reviewer decision required to re-certify.',
    realWorldScenario: 'Brightway Solar approved an email campaign claiming "20% savings". When study parameters updated F-001 ceiling to 15%, the email was flagged stale before re-sending.',
  },
  {
    id: 'guideline-gap',
    title: 'Guideline-Gap & Friction Detector',
    status: 'Prototype built',
    priority: 'P1',
    why: 'Rules that human reviewers constantly dismiss create review fatigue and indicate overly rigid or outdated brand guidelines.',
    whatExistsToday: 'Analytical aggregator on /insights identifying rules with >= 40% dismissal rate and >= 5 decisions, grouped dismissal justifications, and one-click proposed rule version drafting.',
    successMetric: 'Reduces reviewer false-positive friction by surfacing problematic rules to brand managers within 24 hours of pattern emergence.',
    realWorldScenario: 'Reviewers routinely dismissed TERM-001 when technical datasheets mentioned "silicon solar cells" in engineering schematics.',
  },
  {
    id: 'banner-inspection',
    title: 'Advisory Banner & Visual Asset Inspection',
    status: 'Prototype built',
    priority: 'P1',
    why: 'Marketing campaigns include visual banner assets that must satisfy accessibility contrast standards and mandatory legal disclaimers.',
    whatExistsToday: 'Client-side image canvas parser inspecting alt-text presence, mathematical WCAG AA contrast ratio calculation (4.5:1), and required legal disclaimer presence (strictly advisory).',
    successMetric: '100% classification accuracy on fixture suite; findings remain advisory and cannot bypass human blocker gates.',
    realWorldScenario: 'Brightway banner image submitted with low-contrast white text on light-gray sky failed WCAG AA ratio (2.8:1 < 4.5:1 threshold) with immediate visual advisory notice.',
  },
];

