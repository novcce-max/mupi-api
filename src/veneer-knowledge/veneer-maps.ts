import type { VeneerExtractedRaw } from './veneer.types';

/** 纹理关键词 → 标准值：直纹 / 山纹 / 波纹 / 斑纹 */
export const GRAIN_MAP: Record<string, string> = {
  直纹: '直纹',
  直: '直纹',
  直纹明显: '直纹',
  'straight grain': '直纹',
  straight: '直纹',
  山纹: '山纹',
  山: '山纹',
  大山纹: '山纹',
  cathedral: '山纹',
  波纹: '波纹',
  波: '波纹',
  wavy: '波纹',
  斑纹: '斑纹',
  鸟眼: '斑纹',
  斑: '斑纹',
};

/** 场景关键词 → 标准值 */
export const USAGE_MAP: Record<string, string> = {
  家具: '家具',
  家居: '家具',
  门板: '门板',
  门: '门板',
  柜门: '门板',
  定制: '定制',
  全屋定制: '定制',
  工艺品: '工艺品',
  工装: '定制',
  墙板: '定制',
  护墙: '定制',
};

const ALLOWED_GRAINS = new Set(['直纹', '山纹', '波纹', '斑纹']);
const ALLOWED_USAGE = new Set(['家具', '门板', '定制', '工艺品']);
const ALLOWED_STABILITY = new Set(['稳定', '易开裂', '一般']);
const ALLOWED_PRICE = new Set(['高', '中', '低']);
const ALLOWED_RARITY = new Set(['常见', '稀有', '特殊']);

function normalizeGrainToken(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (ALLOWED_GRAINS.has(t)) return t;
  const lower = t.toLowerCase();
  for (const [k, v] of Object.entries(GRAIN_MAP)) {
    if (t.includes(k) || lower.includes(k.toLowerCase())) return v;
  }
  return t.length <= 8 ? t : null;
}

function normalizeUsageToken(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (ALLOWED_USAGE.has(t)) return t;
  for (const [k, v] of Object.entries(USAGE_MAP)) {
    if (t.includes(k)) return v;
  }
  return null;
}

function pickEnum(
  raw: string | undefined,
  allowed: Set<string>,
  aliases: Record<string, string>,
): string | undefined {
  if (!raw?.trim()) return undefined;
  const t = raw.trim();
  if (allowed.has(t)) return t;
  const mapped = aliases[t] ?? aliases[t.toLowerCase()];
  if (mapped && allowed.has(mapped)) return mapped;
  return undefined;
}

const STABILITY_ALIASES: Record<string, string> = {
  较好: '一般',
  一般: '一般',
  中等: '一般',
  不稳定: '易开裂',
  易变形: '易开裂',
};

const PRICE_ALIASES: Record<string, string> = {
  昂贵: '高',
  便宜: '低',
  实惠: '低',
  中档: '中',
  中高价: '高',
};

const RARITY_ALIASES: Record<string, string> = {
  普遍: '常见',
  少见: '稀有',
};

export function normalizeVeneerExtracted(
  raw: Record<string, unknown>,
): VeneerExtractedRaw {
  const g = raw.grain;
  let grain: string | undefined;
  if (typeof g === 'string') {
    const n = normalizeGrainToken(g);
    grain = n && ALLOWED_GRAINS.has(n) ? n : undefined;
  }

  const usageIn = raw.usage;
  const usage: string[] = [];
  if (Array.isArray(usageIn)) {
    for (const item of usageIn) {
      if (typeof item !== 'string') continue;
      const n = normalizeUsageToken(item);
      if (n && !usage.includes(n)) usage.push(n);
    }
  }

  const finishesIn = raw.recommendedFinishes;
  const recommendedFinishes: string[] = [];
  if (Array.isArray(finishesIn)) {
    for (const item of finishesIn) {
      if (typeof item === 'string' && item.trim()) {
        recommendedFinishes.push(item.trim());
      }
    }
  }

  const tagsIn = raw.tags;
  const tags: string[] = [];
  if (Array.isArray(tagsIn)) {
    for (const item of tagsIn) {
      if (typeof item === 'string' && item.trim()) tags.push(item.trim());
    }
  }

  const str = (k: string): string | undefined => {
    const v = raw[k];
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  };

  return {
    name: str('name'),
    latinName: str('latinName'),
    origin: str('origin'),
    color: str('color'),
    grain,
    patternDescription: str('patternDescription'),
    thicknessRange: str('thicknessRange'),
    hardness: str('hardness'),
    stability: pickEnum(str('stability'), ALLOWED_STABILITY, STABILITY_ALIASES),
    moistureSensitivity: str('moistureSensitivity'),
    usage,
    recommendedFinishes,
    priceLevel: pickEnum(str('priceLevel'), ALLOWED_PRICE, PRICE_ALIASES),
    rarity: pickEnum(str('rarity'), ALLOWED_RARITY, RARITY_ALIASES),
    tags,
  };
}
