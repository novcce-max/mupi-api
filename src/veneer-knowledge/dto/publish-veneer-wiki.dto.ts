import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class PublishVeneerWikiDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  /** true 时 wiki status=published，否则 draft */
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}
