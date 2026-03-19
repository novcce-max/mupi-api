import { IsOptional, IsString } from 'class-validator';

export class ProjectKitShareQueryDto {
  @IsOptional()
  @IsString()
  id?: string;
}
