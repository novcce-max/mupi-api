import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PublishVeneerMaterialDto {
  /** 目标选材 slug，默认同 linked_material_slug 或按展示名生成 */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;
}
