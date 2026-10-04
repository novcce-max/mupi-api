import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export type InlineAiMode = 'optimize-seo' | 'expand-content' | 'summarize';

export class InlineAiSuggestionDto {
  @IsIn(['optimize-seo', 'expand-content', 'summarize'])
  mode: InlineAiMode;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80000)
  contentText?: string;
}
