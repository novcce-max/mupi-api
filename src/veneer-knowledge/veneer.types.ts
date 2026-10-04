export type VeneerSourceType = 'official' | 'community' | 'ai_generated';

/** 生产级木皮知识库记录（入库后含 id / 溯源 / 时间） */
export type Veneer = {
  id: string;
  name: string;
  latinName?: string;
  sourceUrl?: string;
  sourceType?: VeneerSourceType;
  sourceDate?: string;
  origin?: string;
  color?: string;
  grain?: string;
  patternDescription?: string;
  thicknessRange?: string;
  hardness?: string;
  stability?: string;
  moistureSensitivity?: string;
  usage?: string[];
  recommendedFinishes?: string[];
  priceLevel?: string;
  rarity?: string;
  tags?: string[];
  notes?: string;
  lastUpdated?: string;
};

/** AI 抽取原始 JSON（未做枚举映射），字段与 Prompt 输出对齐 */
export type VeneerExtractedRaw = {
  name?: string;
  latinName?: string;
  origin?: string;
  color?: string;
  grain?: string;
  patternDescription?: string;
  thicknessRange?: string;
  hardness?: string;
  stability?: string;
  moistureSensitivity?: string;
  usage?: string[];
  recommendedFinishes?: string[];
  priceLevel?: string;
  rarity?: string;
  tags?: string[];
};
