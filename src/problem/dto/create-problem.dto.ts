import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProblemSymptomDto {
  @IsString()
  title: string;

  @IsString()
  frequency: string;

  @IsString()
  scene: string;
}

class ProblemFaqItemDto {
  @IsString()
  q: string;

  @IsString()
  a: string;
}

export class CreateProblemDto {
  @IsString()
  slug: string;

  @IsString()
  category: string;

  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  heroTitle?: string;

  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemSymptomDto)
  symptoms?: ProblemSymptomDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasons?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preventions?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemFaqItemDto)
  faq?: ProblemFaqItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendedMaterialSlugs?: string[];

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
  publishMeta?: Record<string, unknown>;
}
