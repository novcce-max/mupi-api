import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackPageViewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  visitorId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  path: string;

  @IsOptional()
  @IsString()
  referer?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
