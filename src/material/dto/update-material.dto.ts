import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  colorGroup?: string;

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
