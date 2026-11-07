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

export type { Finding } from '../domain/types';

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
