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

import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { IdParamDto } from '../common/dto/id-param.dto';
import { AdminLogService } from '../admin-log/admin-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MaterialSeedService } from './material-seed.service';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('admin/materials')
export class MaterialAdminController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly adminLogService: AdminLogService,
    private readonly materialSeedService: MaterialSeedService,
  ) {}

  @Get()
  async findAll() {
    const items = await this.materialService.adminFindAll();
    return items;
  }

  @Get(':id')
  async findOne(@Param() param: IdParamDto) {
    const item = await this.materialService.adminFindOne(param.id);
    return item;
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateMaterialDto) {
    const created = await this.materialService.adminCreate(dto);
    await this.adminLogService.log({
      req,
      action: 'create',
      resourceType: 'material',
      resourceId: created.id,
      summary: `创建木皮 ${created.slug}`,
    });
    return created;
  }

  @Post('seed')
  async seed(): Promise<{ count: number }> {
    const result = await this.materialSeedService.runSeed();
    return { count: result.count };
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param() param: IdParamDto,
    @Body() dto: UpdateMaterialDto,
  ) {
    const updated = await this.materialService.adminUpdate(param.id, dto);
    const action =
      dto.status === 'published'
        ? 'publish'
        : dto.status === 'draft'
          ? 'unpublish'
          : 'update';
    await this.adminLogService.log({
      req,
      action,
      resourceType: 'material',
      resourceId: updated.id,
      summary: `更新木皮 ${updated.slug}`,
    });
    return updated;
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param() param: IdParamDto) {
    const role =
      (req as Request & { adminRole?: string }).adminRole ?? 'editor';
    if (role !== 'super') {
      throw new ForbiddenException('仅超级管理员可以删除木皮');
    }
    await this.adminLogService.log({
      req,
      action: 'delete',
      resourceType: 'material',
      resourceId: param.id,
      summary: `删除木皮 ${param.id}`,
    });
    await this.materialService.adminRemove(param.id);
    return true;
  }
}
