import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateCaseDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  scene?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  materialGrade?: string;

  @IsOptional()
  @IsString()
  materialName?: string;

  @IsOptional()
  @IsString()
  materialHref?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsString()
  challenge?: string;

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  processImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  beforeImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  afterImages?: string[];

  @IsOptional()
  @IsArray()
  relatedProblems?: { label: string; href: string }[];

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string | null;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  published?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  coverLayout?: string;

  @IsOptional()
  publishMeta?: Record<string, unknown>;

  /** 关联木皮 materials.id 列表；传入则全量覆盖 */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialIds?: string[];
}
