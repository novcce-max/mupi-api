import type { ContentChannel } from './content-ai.types';

/** 与 content_items.content 对齐；供导入 problems / wiki_species / materials */
export const SITE_DRAFT_SCHEMA_VERSION = 2 as const;

export type ProblemSiteDraft = {
  kind: 'problem';
  slug: string;
  category: string;
  title: string;
  summary: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  symptoms: { title: string; frequency: string; scene: string }[];
  reasons: string[];
  steps: string[];
  tools: string[];
  materials: string[];
  preventions: string[];
  faq: { q: string; a: string }[];
  recommendedMaterialSlugs: string[];
  tags: string[];
};

export type WikiSpeciesSiteDraft = {
  kind: 'wiki_species';
  slug: string;
  name: string;
  englishName: string | null;
  category: string;
  description: string;
  photos: string[];
  suitableScenes: { scene: string; advice: string; risk: string }[];
  priceRange: string | null;
  /** 与前台 mapWikiEntityToUi 所用 properties 对齐：subtitle、aliases、sourceAndProcess、glueAndCraft、maintenance、faq、seoKeywords、references、relatedMaterialSlugs、relatedCaseSlugs、heroAlt 等 */
  properties: Record<string, unknown>;
  tags: string[];
};

export type MaterialSiteDraft = {
  kind: 'material';
  slug: string;
  name: string;
  colorGroup: string;
  textureType: string | null;
  finish: string | null;
  thickness: string | null;
  images: string[];
  /** 与 Material 表及前台 normalizeMaterialApiItem 扩展字段对齐 */
  properties: Record<string, unknown>;
  tags: string[];
};

export type SiteDraftBody =
  | ProblemSiteDraft
  | WikiSpeciesSiteDraft
  | MaterialSiteDraft;

export type SiteDraftEnvelope = {
  schemaVersion: typeof SITE_DRAFT_SCHEMA_VERSION;
  channel: ContentChannel;
  preview: { type: 'paragraph'; text: string }[];
  site: SiteDraftBody;
};

export function slugHintOrDraft(
  hint: string | undefined,
  title: string,
): string {
  const h = hint?.trim();
  if (h) return h.slice(0, 200);
  const base = String(title || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  const slug = base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug.slice(0, 200) || `draft-${Date.now().toString(36)}`;
}
