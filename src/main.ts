import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ErrorTrackingInterceptor } from './common/interceptors/error-tracking.interceptor';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

function validateEnv(): void {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const missing: string[] = [];

  if (nodeEnv === 'production') {
    if (!process.env.DATABASE_URL?.trim()) {
      missing.push('DATABASE_URL');
    }
    if (!process.env.JWT_SECRET) {
      missing.push('JWT_SECRET');
    }
    if (!process.env.INTERNAL_RPC_TOKEN && !process.env.INTERNAL_RPC_TOKENS) {
      missing.push('INTERNAL_RPC_TOKEN');
    }
    if (!process.env.CONTACT_ADMIN_KEY) {
      missing.push('CONTACT_ADMIN_KEY');
    }
  }

  if (missing.length > 0) {
    console.error(
      '[Config] Missing required environment variables in production:',
      missing.join(', '),
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Vercel / 反向代理后面：让 req.ip 取客户端真实 IP，否则限流与 IP 白名单会把所有访客算成同一个代理地址。
  const trustProxy =
    process.env.VERCEL === '1' ||
    ['1', 'true'].includes((process.env.TRUST_PROXY || '').toLowerCase());
  if (trustProxy) {
    (app.getHttpAdapter().getInstance() as express.Express).set(
      'trust proxy',
      true,
    );
  }

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.HEADER,
    defaultVersion: '1',
    header: 'X-API-Version',
  });

  app.use(helmet());

  // 浏览器不直连 API（全部经 Next 同源代理），生产只放行 ALLOWED_ORIGINS；未配置时保持原行为。
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(),
    new ErrorTrackingInterceptor(),
    new TransformInterceptor(),
  );

  // 生产默认不公开 Swagger；需要时设 SWAGGER_ENABLED=true。
  const swaggerEnabled =
    (process.env.NODE_ENV || '').toLowerCase() !== 'production' ||
    ['1', 'true'].includes((process.env.SWAGGER_ENABLED || '').toLowerCase());
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Mupi API')
      .setDescription('Mupi.cn backend API documentation')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`[Nest] API listening on port ${port}`);
}

bootstrap();
