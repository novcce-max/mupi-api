import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateWikiSpeciesDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  englishName?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  photos?: unknown[];

  @IsOptional()
  @IsArray()
  suitableScenes?: unknown[];

  @IsOptional()
  @IsString()
  priceRange?: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  coverLayout?: string;

  @IsOptional()
  publishMeta?: Record<string, unknown>;
}
