import { IsOptional, IsString } from 'class-validator';

export class MaterialCompareQueryDto {
  @IsOptional()
  @IsString()
  compare?: string;
}
