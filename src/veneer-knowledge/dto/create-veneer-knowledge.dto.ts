import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import type { VeneerSourceType } from '../veneer.types';

export class CreateVeneerKnowledgeDto {
  @IsObject()
  veneer: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  sourceUrl?: string;

  @IsOptional()
  @IsIn(['official', 'community', 'ai_generated'])
  sourceType?: VeneerSourceType;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sourceDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  rawContentExcerpt?: string;

  @IsOptional()
  @IsObject()
  rawAiExtract?: Record<string, unknown>;
}
