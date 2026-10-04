import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateVeneerKnowledgeDto } from './dto/create-veneer-knowledge.dto';
import { UpdateVeneerKnowledgeDto } from './dto/update-veneer-knowledge.dto';
import { VeneerExtractRequestDto } from './dto/veneer-extract-request.dto';
import { VeneerExtractService } from './veneer-extract.service';
import { PublishVeneerMaterialDto } from './dto/publish-veneer-material.dto';
import { PublishVeneerWikiDto } from './dto/publish-veneer-wiki.dto';
import { VeneerKnowledgePublishService } from './veneer-knowledge-publish.service';
import { VeneerKnowledgeService } from './veneer-knowledge.service';
import { buildVeneerFromExtraction } from './veneer-record.builder';

@UseGuards(JwtAuthGuard)
@Controller('admin/veneer-knowledge')
export class VeneerKnowledgeAdminController {
  constructor(
    private readonly knowledge: VeneerKnowledgeService,
    private readonly extractService: VeneerExtractService,
    private readonly publish: VeneerKnowledgePublishService,
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('extract')
  async extractFromSource(@Body() dto: VeneerExtractRequestDto) {
    let plain = (dto.rawText ?? '').trim();
    if (!plain && dto.sourceUrl?.trim()) {
      plain = await this.extractService.fetchPlainTextFromUrl(
        dto.sourceUrl.trim(),
      );
    }
    if (!plain) {
      throw new BadRequestException('请提供 rawText（≥20 字）或 sourceUrl');
    }

    const { rawAi, normalized } =
      await this.extractService.extractFromPlainText(plain);
    const previewVeneer = buildVeneerFromExtraction(normalized, {
      sourceUrl: dto.sourceUrl?.trim(),
      sourceType: dto.sourceType,
      sourceDate: dto.sourceDate,
    });

    return {
      rawAiExtract: rawAi,
      normalized,
      previewVeneer,
      rawContentExcerpt: plain.slice(0, 8000),
    };
  }

  @Get()
  async list(@Query('q') q?: string, @Query('status') status?: string) {
    return this.knowledge.list({ q, status });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.knowledge.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateVeneerKnowledgeDto) {
    return this.knowledge.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVeneerKnowledgeDto,
  ) {
    return this.knowledge.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.knowledge.remove(id);
    return { ok: true };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/publish-wiki')
  async publishWiki(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishVeneerWikiDto,
  ) {
    return this.publish.publishWiki(id, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/publish-material')
  async publishMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishVeneerMaterialDto,
  ) {
    return this.publish.publishMaterial(id, dto);
  }
}
