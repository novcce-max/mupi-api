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

import { ProblemService } from './problem.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { IdParamDto } from '../common/dto/id-param.dto';
import { AdminLogService } from '../admin-log/admin-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProblemSeedService } from './problem-seed.service';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('admin/problems')
export class ProblemAdminController {
  constructor(
    private readonly problemService: ProblemService,
    private readonly adminLogService: AdminLogService,
    private readonly problemSeedService: ProblemSeedService,
  ) {}

  @Get()
  async findAll() {
    const items = await this.problemService.adminFindAll();
    return items;
  }

  @Get(':id')
  async findOne(@Param() param: IdParamDto) {
    const item = await this.problemService.adminFindOne(param.id);
    return item;
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateProblemDto) {
    const created = await this.problemService.adminCreate(dto);
    await this.adminLogService.log({
      req,
      action: 'create',
      resourceType: 'problem',
      resourceId: created.id,
      summary: `创建问题 ${created.slug}`,
    });
    return created;
  }

  @Post('seed')
  async seed(): Promise<{ count: number }> {
    const result = await this.problemSeedService.runSeed();
    return { count: result.count };
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param() param: IdParamDto,
    @Body() dto: UpdateProblemDto,
  ) {
    const updated = await this.problemService.adminUpdate(param.id, dto);
    const action =
      dto.status === 'published'
        ? 'publish'
        : dto.status === 'draft'
          ? 'unpublish'
          : 'update';
    await this.adminLogService.log({
      req,
      action,
      resourceType: 'problem',
      resourceId: updated.id,
      summary: `更新问题 ${updated.slug}`,
    });
    return updated;
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param() param: IdParamDto) {
    const role =
      (req as Request & { adminRole?: string }).adminRole ?? 'editor';
    if (role !== 'super') {
      throw new ForbiddenException('仅超级管理员可以删除问题');
    }
    await this.adminLogService.log({
      req,
      action: 'delete',
      resourceType: 'problem',
      resourceId: param.id,
      summary: `删除问题 ${param.id}`,
    });
    await this.problemService.adminRemove(param.id);
    return true;
  }
}
