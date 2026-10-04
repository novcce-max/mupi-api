import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DataSource } from 'typeorm';

/**
 * 启动后按文件名顺序执行 scripts/migrations/*.sql（与 scripts/apply-migrations.sh 一致）。
 * 需在镜像内安装 postgresql-client（psql），且 DATABASE_URL 已配置、DataSource 已初始化。
 * 通过环境变量 RUN_SQL_MIGRATIONS=true 开启（Docker Compose 栈默认打开）。
 */
@Injectable()
export class SqlMigrationRunner implements OnApplicationBootstrap {
  private readonly logger = new Logger(SqlMigrationRunner.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const enabled =
      this.config.get<string>('RUN_SQL_MIGRATIONS', '').toLowerCase() ===
      'true';
    if (!enabled) {
      return;
    }
    if (process.env.VERCEL === '1') {
      this.logger.warn(
        'RUN_SQL_MIGRATIONS is ignored on Vercel. Apply scripts/migrations with `npm run db:apply-sql:node` before switching traffic.',
      );
      return;
    }
    const url = this.config.get<string>('DATABASE_URL')?.trim();
    if (!url) {
      this.logger.warn(
        'RUN_SQL_MIGRATIONS is true but DATABASE_URL is empty; skip',
      );
      return;
    }
    if (!this.dataSource.isInitialized) {
      this.logger.warn('DataSource not initialized; skip SQL migrations');
      return;
    }

    try {
      execFileSync('psql', ['--version'], { stdio: 'pipe' });
    } catch {
      this.logger.warn(
        'psql not found (install postgresql-client in image); skip SQL migrations',
      );
      return;
    }

    const root = this.config.get<string>('MIGRATIONS_DIR')?.trim();
    const dir = root
      ? path.resolve(root)
      : path.join(process.cwd(), 'scripts', 'migrations');

    if (!fs.existsSync(dir)) {
      this.logger.warn(`Migrations directory missing: ${dir}; skip`);
      return;
    }

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      this.logger.log(`No .sql files in ${dir}`);
      return;
    }

    this.logger.log(`Applying ${files.length} SQL migration(s) from ${dir}`);

    for (const name of files) {
      const full = path.join(dir, name);
      this.logger.log(`==> ${name}`);
      execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-f', full], {
        stdio: 'inherit',
      });
    }

    this.logger.log('SQL migrations finished');
  }
}
