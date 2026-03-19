import { IsArray, IsString, IsOptional } from 'class-validator';

export class CreateProjectKitDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  materials: string[];

  @IsArray()
  @IsString({ each: true })
  cases: string[];

  @IsArray()
  @IsString({ each: true })
  problems: string[];
}
