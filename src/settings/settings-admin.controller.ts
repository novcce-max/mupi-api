import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { KeyParamDto } from '../common/dto/key-param.dto';
import { AdminLogService } from '../admin-log/admin-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('admin/settings')
export class SettingsAdminController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly adminLogService: AdminLogService,
  ) {}

  @Get(':key')
  async getOne(@Param() param: KeyParamDto) {
    const setting = await this.settingsService.adminGet(param.key);
    return setting;
  }

  @Put(':key')
  async update(
    @Req() req: Request,
    @Param() param: KeyParamDto,
    @Body() dto: UpdateSettingDto,
  ) {
    const role =
      (req as Request & { adminRole?: string }).adminRole ?? 'editor';
    if (param.key !== 'hero-video' && role !== 'super') {
      throw new ForbiddenException('仅超级管理员可以修改站点配置');
    }
    const updated = await this.settingsService.adminUpdate(param.key, dto);
    await this.adminLogService.log({
      req,
      action: 'settings_update',
      resourceType: 'setting',
      resourceId: param.key,
      summary: `更新配置 ${param.key}`,
    });
    return updated;
  }
}
