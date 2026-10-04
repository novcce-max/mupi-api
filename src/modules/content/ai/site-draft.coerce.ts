import type { ContentChannel } from './content-ai.types';
import {
  SITE_DRAFT_SCHEMA_VERSION,
  type MaterialSiteDraft,
  type ProblemSiteDraft,
  type SiteDraftBody,
  type SiteDraftEnvelope,
  type WikiSpeciesSiteDraft,
  slugHintOrDraft,
} from './site-draft.types';

function str(v: unknown, fallback: string): string {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    const s = v.trim();
    return s || fallback;
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    return String(v);
  }
  if (typeof v === 'boolean') {
    return v ? 'true' : 'false';
  }
  return fallback;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    if (typeof x === 'string' && x.trim()) out.push(x.trim());
    else if (typeof x === 'number' && Number.isFinite(x)) out.push(String(x));
  }
  return out;
}

function symptomArr(
  v: unknown,
): { title: string; frequency: string; scene: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = row as Record<string, unknown>;
      return {
        title: str(o.title, ''),
        frequency: str(o.frequency, ''),
        scene: str(o.scene, ''),
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x?.title));
}

function faqArr(v: unknown): { q: string; a: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = row as Record<string, unknown>;
      const q = str(o.q, '');
      const a = str(o.a, '');
      return q && a ? { q, a } : null;
    })
    .filter((x): x is { q: string; a: string } => Boolean(x));
}

function sceneArr(
  v: unknown,
): { scene: string; advice: string; risk: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = row as Record<string, unknown>;
      return {
        scene: str(o.scene, ''),
        advice: str(o.advice, ''),
        risk: str(o.risk, ''),
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x?.scene));
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

export function coerceProblemSite(
  raw: Record<string, unknown>,
  slugFallback: string,
  titleFallback: string,
  summaryFallback: string,
): ProblemSiteDraft {
  return {
    kind: 'problem',
    slug: str(raw.slug, slugFallback).slice(0, 200),
    category: str(raw.category, '症状').slice(0, 100),
    title: str(raw.title, titleFallback).slice(0, 300),
    summary: str(raw.summary, summaryFallback),
    heroTitle: str(raw.heroTitle, titleFallback).slice(0, 400),
    heroSubtitle: str(raw.heroSubtitle, '').slice(0, 400),
    heroImage: str(raw.heroImage, '/images/case-wall.svg').slice(0, 300),
    symptoms:
      symptomArr(raw.symptoms).length > 0
        ? symptomArr(raw.symptoms)
        : [
            {
              title: '典型表现',
              frequency: '—',
              scene: '高可见区域',
            },
          ],
    reasons: strArr(raw.reasons).length ? strArr(raw.reasons) : ['待审核补充'],
    steps: strArr(raw.steps).length
      ? strArr(raw.steps)
      : ['待审核补充处理步骤'],
    tools: strArr(raw.tools),
    materials: strArr(raw.materials),
    preventions: strArr(raw.preventions),
    faq: faqArr(raw.faq).length
      ? faqArr(raw.faq)
      : [{ q: '是否需要整面返工？', a: '先判断范围是否稳定再定方案。' }],
    recommendedMaterialSlugs: strArr(raw.recommendedMaterialSlugs),
    tags: strArr(raw.tags).length ? strArr(raw.tags) : ['ai-draft'],
  };
}

export function coerceWikiSpeciesSite(
  raw: Record<string, unknown>,
  slugFallback: string,
  titleFallback: string,
  summaryFallback: string,
): WikiSpeciesSiteDraft {
  const en = raw.englishName;
  return {
    kind: 'wiki_species',
    slug: str(raw.slug, slugFallback).slice(0, 200),
    name: str(raw.name, titleFallback).slice(0, 200),
    englishName:
      en == null || typeof en !== 'string' || en.trim() === ''
        ? null
        : en.trim().slice(0, 200),
    category: str(raw.category, '树种').slice(0, 100),
    description: str(raw.description, summaryFallback),
    photos: strArr(raw.photos).length
      ? strArr(raw.photos)
      : ['/images/wood-white-oak.svg'],
    suitableScenes:
      sceneArr(raw.suitableScenes).length > 0
        ? sceneArr(raw.suitableScenes)
        : [
            {
              scene: '连续立面',
              advice: '先做小样墙。',
              risk: '批次与拼缝观感。',
            },
          ],
    priceRange: (() => {
      const pr = raw.priceRange;
      if (pr == null) return null;
      if (typeof pr !== 'string') return null;
      const t = pr.trim();
      return t === '' ? null : t.slice(0, 100);
    })(),
    properties: (() => {
      const p = asRecord(raw.properties);
      if (Object.keys(p).length === 0) {
        return {
          subtitle: `${titleFallback}导读`,
          aliases: [],
          sourceAndProcess: [],
          glueAndCraft: [],
          maintenance: [],
          faq: [],
          seoKeywords: [],
          references: [],
          relatedMaterialSlugs: [],
          relatedCaseSlugs: [],
          heroAlt: titleFallback,
          chineseName: titleFallback,
        };
      }
      return p;
    })(),
    tags: strArr(raw.tags).length ? strArr(raw.tags) : ['ai-draft'],
  };
}

export function coerceMaterialSite(
  raw: Record<string, unknown>,
  slugFallback: string,
  titleFallback: string,
  summaryFallback: string,
): MaterialSiteDraft {
  const cg = str(raw.colorGroup, '中性');
  const colorGroup = ['深色', '中性', '浅色'].includes(cg) ? cg : '中性';
  return {
    kind: 'material',
    slug: str(raw.slug, slugFallback).slice(0, 200),
    name: str(raw.name, titleFallback).slice(0, 200),
    colorGroup,
    textureType:
      raw.textureType == null || typeof raw.textureType !== 'string'
        ? null
        : raw.textureType.slice(0, 100),
    finish:
      raw.finish == null || typeof raw.finish !== 'string'
        ? null
        : raw.finish.slice(0, 100),
    thickness:
      raw.thickness == null || typeof raw.thickness !== 'string'
        ? null
        : raw.thickness.slice(0, 100),
    images: strArr(raw.images).length
      ? strArr(raw.images)
      : ['/images/wood-white-oak.svg'],
    properties: (() => {
      const p = asRecord(raw.properties);
      if (Object.keys(p).length === 0) {
        return {
          intro: summaryFallback || `${titleFallback}选材说明`,
          subtitle: `${titleFallback} · 副标题待审`,
          aliases: [],
          category: '天然',
          usage: '',
          priceRange: '发布前人工确认',
        };
      }
      return p;
    })(),
    tags: strArr(raw.tags).length ? strArr(raw.tags) : ['ai-draft'],
  };
}

export function buildEnvelopeFromOpenAi(
  parsed: Record<string, unknown>,
  input: {
    channel: ContentChannel;
    title: string;
    slugHint?: string;
  },
): SiteDraftEnvelope {
  const title = str(parsed.title, input.title).slice(0, 200);
  const summary = str(parsed.summary, '').slice(0, 800);
  const slug = slugHintOrDraft(input.slugHint, title);

  let preview: { type: 'paragraph'; text: string }[];
  if (Array.isArray(parsed.preview)) {
    preview = [];
    for (const row of parsed.preview) {
      if (!row || typeof row !== 'object') continue;
      const t = (row as Record<string, unknown>).text;
      if (typeof t === 'string' && t.trim()) {
        preview.push({ type: 'paragraph', text: t.trim() });
      }
    }
  } else if (Array.isArray(parsed.content)) {
    preview = [];
    for (const row of parsed.content) {
      if (!row || typeof row !== 'object') continue;
      const t = (row as Record<string, unknown>).text;
      if (typeof t === 'string' && t.trim()) {
        preview.push({ type: 'paragraph', text: t.trim() });
      }
    }
  } else {
    preview = [{ type: 'paragraph', text: summary || title }];
  }

  const siteRaw = asRecord(parsed.site);
  let site: SiteDraftBody;

  if (input.channel === 'wenti') {
    site = coerceProblemSite(siteRaw, slug, title, summary);
  } else if (input.channel === 'baike') {
    site = coerceWikiSpeciesSite(siteRaw, slug, title, summary);
  } else {
    site = coerceMaterialSite(siteRaw, slug, title, summary);
  }

  return {
    schemaVersion: SITE_DRAFT_SCHEMA_VERSION,
    channel: input.channel,
    preview,
    site,
  };
}
