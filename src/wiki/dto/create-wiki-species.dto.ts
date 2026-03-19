import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateWikiSpeciesDto {
  @ApiProperty({
    description: '物种中文名称',
    example: '法国橡木',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '物种英文名称，可选',
    example: 'French Oak',
    required: false,
  })
  @IsOptional()
  @IsString()
  englishName?: string;

  @ApiProperty({
    description: '唯一标识 slug，用于 URL 访问',
    example: 'french-oak',
  })
  @IsString()
  slug: string;

  @ApiProperty({
    description: '物种所属分类，例如材料类别或用途',
    example: 'wood',
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: '物种简介或说明，可选，支持富文本',
    example: '法国橡木具有细腻的木纹和良好的稳定性，常用于高端家具和地板。',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '物种图片 URL 列表，可选',
    example: ['https://cdn.mupi.cn/wiki/french-oak-1.jpg'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  photos?: unknown[];

  @ApiProperty({
    description: '适用场景列表，例如客厅、卧室等，可选',
    example: ['living_room', 'bedroom'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  suitableScenes?: unknown[];

  @ApiProperty({
    description: '价格区间描述，可选',
    example: '¥500-¥800/㎡',
    required: false,
  })
  @IsOptional()
  @IsString()
  priceRange?: string;

  @ApiProperty({
    description: '扩展属性，存放耐磨性、环保等级等 JSON 信息，可选',
    example: { abrasionResistance: 'AC4', ecoLevel: 'E0' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiProperty({
    description: '发布状态，draft=草稿，published=已发布',
    example: 'published',
    required: false,
    enum: ['draft', 'published'],
  })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @ApiProperty({
    description: '标签列表，例如“耐磨”、“环保”等，可选',
    example: ['durable', 'eco-friendly'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: '封面布局样式，可选，例如 single / collage',
    example: 'single',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverLayout?: string;

  @ApiProperty({
    description: '发布相关元信息，例如首页推荐标记、展示配置等，可选',
    example: { featuredOnHome: true },
    required: false,
  })
  @IsOptional()
  publishMeta?: Record<string, unknown>;
}
