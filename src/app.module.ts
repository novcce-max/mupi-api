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

const logger = new Logger('AppModule');

@Module({
  imports: [
    // 全局配置模块：按环境加载（本地/CI/生产更稳定）
    // 优先级：.env.local > .env.{NODE_ENV} > .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

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
        const redisUrl = configService.get<string>('REDIS_URL');

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
        const disableByEnv = nodeEnv === 'development';
        const disableByFlag =
          (configService.get<string>('DISABLE_DATABASE') || '').toLowerCase() ===
          'true';
        const databaseDisabled = !databaseUrl || disableByEnv || disableByFlag;

        if (databaseDisabled) {
          logger.warn('Database disabled');
        }

        return {
          type: 'postgres',
          url: databaseUrl || 'postgres://disabled:disabled@127.0.0.1:5432/disabled',
          host: configService.get<string>('DB_HOST') || undefined,
          port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
          username: configService.get<string>('DB_USERNAME', 'mupi_user'),
          password: configService.get<string>('DB_PASSWORD') ?? '',
          database: configService.get<string>('DB_DATABASE', 'mupi_dev'),
          // 开发环境下自动建表，生产环境请确保为 false
          synchronize: !isProd && !databaseDisabled,
          autoLoadEntities: true,
          manualInitialization: databaseDisabled,
          extra: {
            max: 20,
            idleTimeoutMillis: 30000,
          },
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
    MemberModule,
    CaseModule,
    ProblemModule,
    ProjectKitModule,
    SettingsModule,
    AdminLogModule,
    HealthModule,
    ContentModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
