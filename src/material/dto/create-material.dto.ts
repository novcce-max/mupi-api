import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  colorGroup: string;

  @IsOptional()
  @IsString()
  textureType?: string;

  @IsOptional()
  @IsString()
  finish?: string;

  @IsOptional()
  @IsString()
  thickness?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  /** 与前端结构对齐的扩展字段（aliases, category, texture, priceRange 等） */
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  coverLayout?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string | null;

  @IsOptional()
  publishMeta?: Record<string, unknown>;
}
