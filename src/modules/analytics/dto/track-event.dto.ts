import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class TrackEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  visitorId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  path?: string;

  @IsOptional()
  @IsString()
  referer?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
