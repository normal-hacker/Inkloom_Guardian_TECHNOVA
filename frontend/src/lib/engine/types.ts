export type Severity = 'blocker' | 'major' | 'minor' | 'info';

export type Category =
  | 'tone'
  | 'terminology'
  | 'messaging'
  | 'claim'
  | 'fact'
  | 'accessibility'
  | 'visual'
  | 'confidentiality';

export type Origin = 'rule' | 'ai';

export interface Finding {
  id: string;
  ruleId?: string;
  ruleKey: string;
  ruleTitle: string;
  ruleSetVersion: number;
  sourceDoc: string;
  sourceSection?: string;
  origin: Origin;
  category: Category;
  severity: Severity;
  spanStart: number;
  spanEnd: number;
  quote: string;
  explanation: string;
  suggestion?: string;
  confidence: number;
  status: 'open' | 'fixed' | 'dismissed' | 'overridden';
}

export interface ApprovedFactItem {
  id: string;
  key: string;
  statement: string;
  values: Array<{ min?: number; max?: number; value?: number; unit: string }>;
  unit: string;
  keywords: string[];
}

export interface GlossaryTermItem {
  term: string;
  kind: 'preferred' | 'banned' | 'discouraged';
  preferredAlternative?: string;
  caseSensitive?: boolean;
}

export interface EngineContext {
  ruleSetVersion?: number;
  imageAltText?: string;
  facts?: ApprovedFactItem[];
  glossary?: GlossaryTermItem[];
  confidentialTerms?: string[];
}
