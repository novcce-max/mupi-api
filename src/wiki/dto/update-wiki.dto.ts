import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateWikiDto {
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
}
