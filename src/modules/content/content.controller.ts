import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { IdParamDto } from '../../common/dto/id-param.dto';
import { isTrustedInternalAdminRequest } from '../../common/internal-admin-request';
import { ContentAiService } from './content-ai.service';
import { InlineAiSuggestionDto } from './dto/inline-ai-suggestion.dto';
import { EditorAiService } from './editor-ai.service';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { GenerateContentDraftDto } from './dto/generate-content-draft.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('content')
export class ContentController {
  constructor(
    private readonly service: ContentService,
    private readonly contentAi: ContentAiService,
    private readonly editorAi: EditorAiService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('status') status?: 'draft' | 'published' | 'all',
    @Query('channel') channel?: string,
  ) {
    return this.service.list({
      q,
      status: status ?? 'published',
      channel: channel?.trim() || undefined,
    });
  }

  /** 前台文章页：须放在 :id 之前，避免被当成数字 id */
  @Get('slug/:slug')
  async findPublishedBySlug(@Param('slug') slug: string) {
    return this.service.findPublishedBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param() param: IdParamDto, @Req() req: Request) {
    const id = Number(param.id);
    if (isTrustedInternalAdminRequest(req, this.config)) {
      return this.service.findOne(id);
    }
    return this.service.findPublishedById(id);
  }

  /** AI 生成草稿（默认 Stub；设置 CONTENT_AI_DRIVER=openai 且配置 OPENAI_API_KEY 后走 GPT） */
  @UseGuards(JwtAuthGuard)
  @Post('ai/drafts')
  async createAiDraft(@Body() dto: GenerateContentDraftDto) {
    return this.contentAi.createDraftFromAi(dto);
  }

  /** CMS 文章页右侧「AI 助手」：SEO / 摘要 / 扩展段落（无 OPENAI_API_KEY 时返回与旧版一致的占位） */
  @UseGuards(JwtAuthGuard)
  @Post('ai/inline-suggestions')
  async inlineAiSuggestions(@Body() dto: InlineAiSuggestionDto) {
    return this.editorAi.suggest({
      mode: dto.mode,
      title: dto.title,
      summary: dto.summary,
      contentText: dto.contentText,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateContentDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param() param: IdParamDto, @Body() dto: UpdateContentDto) {
    return this.service.update(Number(param.id), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param() param: IdParamDto) {
    return this.service.remove(Number(param.id));
  }
}
