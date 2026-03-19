import { IsOptional, IsString } from 'class-validator';

export class CaseQueryDto {
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
  q?: string;
}
