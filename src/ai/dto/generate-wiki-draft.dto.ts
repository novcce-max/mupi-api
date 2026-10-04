import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class GenerateWikiDraftDto {
  @ApiProperty({
    description: '百科主题或物种名称，例如「法国橡木」',
    example: '黑胡桃直纹木皮',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  topic: string;

  @ApiProperty({
    description: '可选补充说明（产地、用途、风格等），会一并交给模型',
    required: false,
  })
  @IsOptional()
  @IsString()
  context?: string;
}
