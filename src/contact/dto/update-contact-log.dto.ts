import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateContactLogDto {
  @IsOptional()
  @IsIn([
    'new',
    'contacted',
    'in_progress',
    'quoted',
    'sampling',
    'won',
    'lost',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignee?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsISO8601()
  followUpAt?: string | null;
}
