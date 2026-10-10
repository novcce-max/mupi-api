import { Module } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { redisStore } from 'cache-manager-redis-yet';
import { Redis } from 'ioredis';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { WikiModule } from './wiki/wiki.module';
import { MaterialModule } from './material/material.module';
import { CaseMaterialModule } from './case-material/case-material.module';
import { MemberModule } from './member/member.module';
import { CaseModule } from './case/case.module';
import { ProblemModule } from './problem/problem.module';
import { ProjectKitModule } from './project-kit/project-kit.module';
import { SettingsModule } from './settings/settings.module';
import { AdminLogModule } from './admin-log/admin-log.module';
import { HealthModule } from './health/health.module';
import { TypeOrmLoggerService } from './common/typeorm-logger.service';
import { RedisThrottlerStorageService } from './common/redis-throttler.storage';
import { ContentModule } from './modules/content/content.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MediaModule } from './media/media.module';
import { AiModule } from './ai/ai.module';
import { VeneerKnowledgeModule } from './veneer-knowledge/veneer-knowledge.module';
import { resolveMupiApiEnvFilePaths } from './config/env-files';
import { TYPEORM_ENTITIES } from './database/typeorm-entities';
import { SqlMigrationRunner } from './database/sql-migration.runner';

const logger = new Logger('AppModule');

function usableRedisUrl(configService: ConfigService): string | undefined {
  const redisUrl = configService.get<string>('REDIS_URL')?.trim();
  if (!redisUrl) return undefined;
  if (process.env.VERCEL !== '1') return redisUrl;

  let host = '';
  try {
    host = new URL(redisUrl).hostname;
  } catch {
    logger.warn(
      'REDIS_URL is invalid on Vercel. Using in-memory cache and throttling.',
    );
    return undefined;
  }

  const localHosts = new Set([
    'localhost',
    '127.0.0.1',
    'mupi-redis',
    'host.docker.internal',
  ]);
  if (localHosts.has(host) || host.endsWith('.internal')) {
    logger.warn(
      `REDIS_URL host ${host} is not reachable from Vercel. Using in-memory cache and throttling.`,
    );
    return undefined;
  }
  return redisUrl;
}

function postgresPoolExtra(databaseUrl: string | undefined) {
  const onVercel = process.env.VERCEL === '1';
  const sslFlag = (process.env.DATABASE_SSL || '').trim().toLowerCase();
  const sslDisabled = sslFlag === 'false' || sslFlag === '0';
  const sslForced = sslFlag === 'true' || sslFlag === '1';
  const urlRequiresSsl =
    !!databaseUrl &&
    /(?:^|[?&])sslmode=(?:require|verify-ca|verify-full)(?:&|$)/i.test(
      databaseUrl,
    );
  const useSsl = !sslDisabled && (sslForced || urlRequiresSsl);

  // Vercel Fluid compute 下一个实例会并发处理多个请求；配合 Neon 的 -pooler 连接串使用 5 条即可。
  // connectionTimeoutMillis 让库唤醒失败时尽快报错，不拖到前端 15s 超时。
  return {
    max: onVercel ? 5 : 20,
    idleTimeoutMillis: onVercel ? 10_000 : 30_000,
    ...(onVercel ? { connectionTimeoutMillis: 10_000 } : {}),
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

const mupiApiEnvFiles = resolveMupiApiEnvFilePaths();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ...(mupiApiEnvFiles.length > 0
        ? { envFilePath: mupiApiEnvFiles }
        : { ignoreEnvFile: true }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = usableRedisUrl(configService);

        // 开发环境或未配置 REDIS_URL 时，退化为内存缓存，避免 Redis 连接错误
        if (!redisUrl) {
          logger.warn(
            'REDIS_URL is not set. Redis cache is disabled, falling back to in-memory cache.',
          );
          return {
            ttl: 60,
          };
        }

        return {
          store: await redisStore({
            url: redisUrl,
            ttl: 60,
          }),
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = usableRedisUrl(configService);

        // 开发环境或未配置 REDIS_URL 时，使用内存存储的限流，避免 Redis 连接错误
        if (!redisUrl) {
          logger.warn(
            'REDIS_URL is not set. Redis throttling is disabled, falling back to in-memory throttling.',
          );
          return {
            throttlers: [
              {
                ttl: 60,
                limit: 60,
              },
            ],
          };
        }

        const redis = new Redis(redisUrl);

        return {
          throttlers: [
            {
              ttl: 60,
              limit: 60,
              storage: new RedisThrottlerStorageService(redis),
            },
          ],
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = (
          configService.get<string>('NODE_ENV') || ''
        ).toLowerCase();
        const isProd = nodeEnv === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL')?.trim();
        const dbHost = configService.get<string>('DB_HOST')?.trim();
        const dbPort = parseInt(
          configService.get<string>('DB_PORT', '5432'),
          10,
        );
        const dbUsername =
          configService.get<string>('DB_USERNAME', 'mupi_user') ?? 'mupi_user';
        const dbPassword = configService.get<string>('DB_PASSWORD') ?? '';
        const dbDatabase =
          configService.get<string>('DB_DATABASE', 'mupi_dev') ?? 'mupi_dev';
        const disableByFlag =
          (
            configService.get<string>('DISABLE_DATABASE') || ''
          ).toLowerCase() === 'true';
        const hasDiscreteDbConfig = !!dbHost && !!dbDatabase && !!dbUsername;
        // 勿在 development 下无条件关库：会导致 manualInitialization、跳过 initialize()，
        // TypeORM 不会 buildMetadatas，任何 Repository 都会 EntityMetadataNotFoundError。
        const databaseDisabled =
          disableByFlag || (!databaseUrl && !hasDiscreteDbConfig);

        if (databaseDisabled) {
          logger.warn(
            'Database disabled (set DATABASE_URL or DB_HOST/DB_DATABASE, and unset DISABLE_DATABASE to enable)',
          );
        }

        const typeormSyncExplicit =
          (configService.get<string>('TYPEORM_SYNC') || '').toLowerCase() ===
          'true';
        // 空库首次 Docker 部署：可设 TYPEORM_SYNC=true 让实体建表，再跑 RUN_SQL_MIGRATIONS 执行 scripts/migrations
        const synchronize =
          (!isProd && !databaseDisabled) ||
          (typeormSyncExplicit && !databaseDisabled);
        if (typeormSyncExplicit && !databaseDisabled) {
          logger.warn(
            'TYPEORM_SYNC=true: TypeORM synchronize is ON. Turn off after initial schema for production safety.',
          );
        }

        return {
          type: 'postgres',
          url: databaseUrl || undefined,
          host: dbHost || undefined,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          synchronize,
          entities: [...TYPEORM_ENTITIES],
          autoLoadEntities: false,
          manualInitialization: databaseDisabled,
          extra: postgresPoolExtra(databaseUrl),
          logging: isProd ? ['error', 'warn'] : true,
          maxQueryExecutionTime: 2000,
          logger: new TypeOrmLoggerService(isProd),
        };
      },
    }),
    AuthModule,
    ContactModule,
    WikiModule,
    MaterialModule,
    CaseMaterialModule,
    MemberModule,
    CaseModule,
    ProblemModule,
    ProjectKitModule,
    SettingsModule,
    AdminLogModule,
    HealthModule,
    ContentModule,
    AnalyticsModule,
    MediaModule,
    AiModule,
    VeneerKnowledgeModule,
  ],
  providers: [
    SqlMigrationRunner,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
