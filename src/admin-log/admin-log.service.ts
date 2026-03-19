import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';

import { AdminLog } from './entities/admin-log.entity';

export type AdminLogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'settings_update';

@Injectable()
export class AdminLogService {
  private readonly logger = new Logger(AdminLogService.name);

  constructor(
    @InjectRepository(AdminLog)
    private readonly repo: Repository<AdminLog>,
  ) {}

  async log(options: {
    req: Request | null;
    action: AdminLogAction | string;
    resourceType: string;
    resourceId?: string | null;
    summary?: string | null;
  }): Promise<void> {
    const { req, action, resourceType, resourceId, summary } = options;

    const username =
      (req?.headers['x-admin-user'] as string | undefined) ?? null;
    const role = (req?.headers['x-admin-role'] as string | undefined) ?? null;
    const method = req?.method ?? 'UNKNOWN';
    const path = req?.originalUrl ?? req?.url ?? 'UNKNOWN';
    const ip =
      (req?.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req?.ip ??
      null;
    const userAgent = req?.headers['user-agent'] ?? null;

    const entity = this.repo.create({
      username,
      role,
      action,
      resourceType,
      resourceId: resourceId ?? null,
      method,
      path,
      ip,
      userAgent,
      summary: summary ?? null,
    });

    try {
      await this.repo.save(entity);
    } catch (e) {
      this.logger.error('Failed to save admin log', (e as Error).stack);
    }
  }

  async findLatest(limit = 100): Promise<AdminLog[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 500);
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });
  }
}
