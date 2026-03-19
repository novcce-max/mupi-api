import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { WikiService } from './wiki.service';
import { CreateWikiSpeciesDto } from './dto/create-wiki-species.dto';
import { UpdateWikiSpeciesDto } from './dto/update-wiki-species.dto';
import { IdParamDto } from '../common/dto/id-param.dto';
import { AdminLogService } from '../admin-log/admin-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WikiSeedService } from './wiki-seed.service';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('admin/wiki-species')
export class WikiAdminController {
  constructor(
    private readonly wikiService: WikiService,
    private readonly adminLogService: AdminLogService,
    private readonly wikiSeedService: WikiSeedService,
  ) {}

  @Get()
  async findAll() {
    const items = await this.wikiService.adminFindAll();
    return items;
  }

  @Get(':id')
  async findOne(@Param() param: IdParamDto) {
    const item = await this.wikiService.adminFindOne(param.id);
    return item;
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateWikiSpeciesDto) {
    const created = await this.wikiService.adminCreate(dto);
    await this.adminLogService.log({
      req,
      action: 'create',
      resourceType: 'wiki-species',
      resourceId: created.id,
      summary: `创建百科物种 ${created.slug}`,
    });
    return created;
  }

  @Post('seed')
  async seed(): Promise<{ count: number }> {
    const result = await this.wikiSeedService.runSeed();
    return { count: result.count };
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param() param: IdParamDto,
    @Body() dto: UpdateWikiSpeciesDto,
  ) {
    const updated = await this.wikiService.adminUpdate(param.id, dto);
    const action =
      dto.status === 'published'
        ? 'publish'
        : dto.status === 'draft'
          ? 'unpublish'
          : 'update';
    await this.adminLogService.log({
      req,
      action,
      resourceType: 'wiki-species',
      resourceId: updated.id,
      summary: `更新百科物种 ${updated.slug}`,
    });
    return updated;
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param() param: IdParamDto) {
    const role =
      (req as Request & { adminRole?: string }).adminRole ?? 'editor';
    if (role !== 'super') {
      throw new ForbiddenException('仅超级管理员可以删除百科物种');
    }
    await this.adminLogService.log({
      req,
      action: 'delete',
      resourceType: 'wiki-species',
      resourceId: param.id,
      summary: `删除百科物种 ${param.id}`,
    });
    await this.wikiService.adminRemove(param.id);
    return true;
  }
}
