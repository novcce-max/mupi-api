import { IsIn, IsOptional } from 'class-validator';

export const CONTACT_STATS_RANGE_VALUES = [
  'all',
  'today',
  'yesterday',
  '7d',
  '30d',
] as const;

export type ContactStatsRange = (typeof CONTACT_STATS_RANGE_VALUES)[number];

export class ContactFunnelQueryDto {
  @IsOptional()
  @IsIn(CONTACT_STATS_RANGE_VALUES)
  range?: ContactStatsRange;
}
