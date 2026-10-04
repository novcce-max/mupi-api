import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import type { VeneerSourceType } from '../veneer.types';

export class VeneerExtractRequestDto {
  /** 粘贴正文；与 sourceUrl 二选一或同时提供时优先用正文 */
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(24000)
  rawText?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  @MaxLength(2048)
  sourceUrl?: string;

  @IsOptional()
  @IsIn(['official', 'community', 'ai_generated'])
  sourceType?: VeneerSourceType;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sourceDate?: string;
}
