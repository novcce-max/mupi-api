import { Logger } from '@nestjs/common';
import type { Logger as TypeOrmLogger, LogLevel, QueryRunner } from 'typeorm';

export class TypeOrmLoggerService implements TypeOrmLogger {
  private readonly logger = new Logger('TypeORM');

  constructor(private readonly isProd: boolean) {}

  logQuery(
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ): void {
    if (!this.isProd) {
      const params =
        parameters && parameters.length > 0
          ? ` -- params: ${JSON.stringify(parameters)}`
          : '';
      this.logger.debug(`Query: ${query}${params}`);
    }
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ): void {
    const params =
      parameters && parameters.length > 0
        ? ` -- params: ${JSON.stringify(parameters)}`
        : '';
    this.logger.error(
      `Query failed: ${query}${params}`,
      error instanceof Error ? error.stack : String(error),
    );
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ): void {
    const params =
      parameters && parameters.length > 0
        ? ` -- params: ${JSON.stringify(parameters)}`
        : '';
    this.logger.warn(`Slow query (${time} ms): ${query}${params}`);
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner): void {
    if (!this.isProd) {
      this.logger.log(message);
    }
  }

  logMigration(message: string, _queryRunner?: QueryRunner): void {
    this.logger.log(message);
  }

  log(
    level: 'log' | 'info' | 'warn',
    message: unknown,
    _queryRunner?: QueryRunner,
  ): void {
    if (level === 'warn') {
      this.logger.warn(message);
    } else if (!this.isProd) {
      this.logger.log(message);
    }
  }
}
