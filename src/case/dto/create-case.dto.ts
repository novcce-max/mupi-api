import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsString()
  scene: string;

  @IsString()
  budget: string;

  @IsString()
  difficulty: string;

  @IsString()
  materialGrade: string;

  @IsString()
  materialName: string;

  @IsString()
  materialHref: string;

  @IsString()
  area: string;

  @IsString()
  timeline: string;

  @IsString()
  challenge: string;

  @IsString()
  solution: string;

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

  /** 关联木皮 materials.id 列表（多对多） */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialIds?: string[];
}
