import { IsObject, IsOptional } from 'class-validator';

export class UpdateSettingDto {
  @IsOptional()
  @IsObject()
  value?: Record<string, unknown>;
}
