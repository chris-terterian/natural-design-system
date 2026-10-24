export type TemplateId = 'homepage' | 'collection' | 'product';
export type SectionKind =
  | 'navigation' | 'hero' | 'intro' | 'banner' | 'product-row' | 'story'
  | 'filters' | 'load-more' | 'product-gallery' | 'product-summary' | 'product-details' | 'footer';
export type ProductSource =
  | 'curated' | 'new' | 'collection' | 'related'
  | 'recently-viewed' | 'because-you-bought' | 'recommended';

export interface Section<P = Record<string, unknown>> {
  kind: SectionKind;
  props?: P;
  /** Product rows: where the products come from. */
  source?: ProductSource;
  /** Personalised rows: why the shopper sees them. */
  reason?: string;
  /** Personalised rows: what shows when there isn't enough history. */
  fallback?: { source: ProductSource; title?: string; products: unknown[] };
  /** Set by validateComposition when the fallback replaced the personalised products. */
  usedFallback?: boolean;
}

export interface Composition {
  template: TemplateId;
  slots: Partial<Record<string, Section[]>>;
}

export interface ContractIssue {
  slot: string | null;
  index: number | null;
  rule: string;
  message: string;
}

export interface SlotContract {
  id: string;
  accepts: SectionKind[];
  min: number;
  max: number;
  layout?: 'split-start' | 'split-end';
  rules?: { type: string; kind?: SectionKind; min?: number; max?: number; allow?: ProductSource[]; reason: string }[];
}

export interface TemplateContract {
  version: number;
  sections: Record<string, { component: string; description: string; requires?: string[]; needsSource?: boolean; minItems?: number; maxItems?: number }>;
  sources: Record<string, { personalized: boolean; description: string }>;
  personalization: { requiresReason: boolean; requiresFallback: boolean; fallbackSources: ProductSource[]; maxPerPage: number };
  templates: Record<string, { name: string; description: string; slots: SlotContract[] }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ContractIssue[];
  warnings: ContractIssue[];
  resolved: Composition | null;
}

export function validateComposition(contract: TemplateContract, composition: Composition): ValidationResult;
export function templateSlots(contract: TemplateContract, templateId: string): SlotContract[];
export function expandProductRefs<T>(value: T, products: Record<string, unknown[]>): T;
