import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AdminLogService } from './admin-log.service';
import { AdminLogQueryDto } from './dto/admin-log-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('admin/logs')
export class AdminLogController {
  constructor(private readonly adminLogService: AdminLogService) {}

  @Get()
  async findLatest(@Query() query: AdminLogQueryDto): Promise<unknown[]> {
    const n = query.limit ?? 100;
    const items = await this.adminLogService.findLatest(n);
    return items;
  }
}
