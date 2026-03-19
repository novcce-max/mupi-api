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

import { CaseService } from './case.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { IdParamDto } from '../common/dto/id-param.dto';
import { AdminLogService } from '../admin-log/admin-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CaseSeedService } from './case-seed.service';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('admin/cases')
export class CaseAdminController {
  constructor(
    private readonly caseService: CaseService,
    private readonly adminLogService: AdminLogService,
    private readonly caseSeedService: CaseSeedService,
  ) {}

  @Get()
  async findAll() {
    const items = await this.caseService.adminFindAll();
    return items;
  }

  @Get(':id')
  async findOne(@Param() param: IdParamDto) {
    const item = await this.caseService.adminFindOne(param.id);
    return item;
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCaseDto) {
    const created = await this.caseService.adminCreate(dto);
    await this.adminLogService.log({
      req,
      action: 'create',
      resourceType: 'case',
      resourceId: created.id,
      summary: `创建案例 ${created.slug}`,
    });
    return created;
  }

  @Post('seed')
  async seed(): Promise<{ count: number }> {
    const result = await this.caseSeedService.runSeed();
    return { count: result.count };
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param() param: IdParamDto,
    @Body() dto: UpdateCaseDto,
  ) {
    const updated = await this.caseService.adminUpdate(param.id, dto);
    const action =
      dto.published === true
        ? 'publish'
        : dto.published === false
          ? 'unpublish'
          : 'update';
    await this.adminLogService.log({
      req,
      action,
      resourceType: 'case',
      resourceId: updated.id,
      summary: `更新案例 ${updated.slug}`,
    });
    return updated;
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param() param: IdParamDto) {
    const role =
      (req as Request & { adminRole?: string }).adminRole ?? 'editor';
    if (role !== 'super') {
      throw new ForbiddenException('仅超级管理员可以删除案例');
    }
    await this.adminLogService.log({
      req,
      action: 'delete',
      resourceType: 'case',
      resourceId: param.id,
      summary: `删除案例 ${param.id}`,
    });
    await this.caseService.adminRemove(param.id);
    return true;
  }
}
