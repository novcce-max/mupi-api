import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { GenerateWikiDraftDto } from './dto/generate-wiki-draft.dto';

@ApiTags('AI（管理）')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('admin/ai')
export class AiAdminController {
  constructor(private readonly aiService: AiService) {}

  @Post('wiki/draft')
  @ApiOperation({
    summary: '生成木皮百科草稿（JSON）',
    description:
      '通过 MUPI_AI_GENERATE_URL 调用 Vercel mupi-ai，返回与百科创建相近的结构化字段，供后台参考或粘贴。',
  })
  async wikiDraft(@Body() dto: GenerateWikiDraftDto) {
    return this.aiService.generateWikiDraft(dto.topic, dto.context);
  }
}
