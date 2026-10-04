import { IsIn, IsOptional } from 'class-validator';

export const ANALYTICS_RANGE_VALUES = [
  'all',
  'today',
  'yesterday',
  '7d',
  '30d',
] as const;

export const ANALYTICS_SOURCE_KIND_VALUES = [
  'all',
  'search',
  'direct',
  'wechat',
  'referral',
] as const;

export type AnalyticsRange = (typeof ANALYTICS_RANGE_VALUES)[number];
export type AnalyticsSourceKind = (typeof ANALYTICS_SOURCE_KIND_VALUES)[number];

export class AnalyticsQueryDto {
  @IsOptional()
  @IsIn(ANALYTICS_RANGE_VALUES)
  range?: AnalyticsRange;

  @IsOptional()
  @IsIn(ANALYTICS_SOURCE_KIND_VALUES)
  sourceKind?: AnalyticsSourceKind;
}
