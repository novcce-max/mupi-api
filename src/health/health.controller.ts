import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * 注意：`GET /api/health` 只表示进程存活，不验证数据库。
 * 部署后若「健康但无数据」，请用 `GET /api/health/db` 核对库连接与当前库名。
 */
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @Version(VERSION_NEUTRAL)
  check(): { ok: true } {
    return { ok: true };
  }

  /**
   * 验证 TypeORM 到 PostgreSQL 的连接，并返回当前库名/用户（便于排查连错库）。
   */
  @Get('db')
  @Version(VERSION_NEUTRAL)
  async checkDb(): Promise<{
    ok: true;
    database: 'up';
    currentDatabase: string;
    currentUser: string;
  }> {
    try {
      const rows = await this.dataSource.query(
        'SELECT current_database() AS "currentDatabase", current_user AS "currentUser"',
      );
      const row = rows[0];
      return {
        ok: true,
        database: 'up',
        currentDatabase: row?.currentDatabase ?? '',
        currentUser: row?.currentUser ?? '',
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new HttpException(
        { ok: false, database: 'down', message },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
