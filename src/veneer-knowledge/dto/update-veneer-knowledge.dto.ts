import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateVeneerKnowledgeDto {
  @IsOptional()
  @IsObject()
  veneer?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['draft', 'confirmed', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  linkedWikiSlug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  linkedMaterialSlug?: string;
}
