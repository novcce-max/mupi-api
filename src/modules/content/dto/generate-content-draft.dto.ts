import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateContentDraftDto {
  @IsIn(['baike', 'mupi', 'wenti'])
  channel: 'baike' | 'mupi' | 'wenti';

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  brief?: string;
}
