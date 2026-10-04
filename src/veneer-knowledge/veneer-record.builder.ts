import { randomUUID } from 'crypto';

import type {
  Veneer,
  VeneerExtractedRaw,
  VeneerSourceType,
} from './veneer.types';

export type BuildVeneerRecordOpts = {
  sourceUrl?: string;
  sourceType?: VeneerSourceType;
  sourceDate?: string;
  notes?: string;
};

export function buildVeneerFromExtraction(
  normalized: VeneerExtractedRaw,
  opts: BuildVeneerRecordOpts & { id?: string },
): Veneer {
  const id = opts.id ?? randomUUID();
  const now = new Date().toISOString();
  const name = (normalized.name ?? '').trim() || '未命名木皮';

  return {
    id,
    name,
    latinName: normalized.latinName,
    sourceUrl: opts.sourceUrl,
    sourceType: opts.sourceType,
    sourceDate: opts.sourceDate,
    origin: normalized.origin,
    color: normalized.color,
    grain: normalized.grain,
    patternDescription: normalized.patternDescription,
    thicknessRange: normalized.thicknessRange,
    hardness: normalized.hardness,
    stability: normalized.stability,
    moistureSensitivity: normalized.moistureSensitivity,
    usage: normalized.usage?.length ? normalized.usage : undefined,
    recommendedFinishes: normalized.recommendedFinishes?.length
      ? normalized.recommendedFinishes
      : undefined,
    priceLevel: normalized.priceLevel,
    rarity: normalized.rarity,
    tags: normalized.tags?.length ? normalized.tags : undefined,
    notes: opts.notes,
    lastUpdated: now,
  };
}
