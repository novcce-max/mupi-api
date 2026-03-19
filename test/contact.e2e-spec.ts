import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';

import { ContactController } from '../src/contact/contact.controller';
import { ContactService, ContactCreateResult } from '../src/contact/contact.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

class FakeContactService implements Partial<ContactService> {
  // 只模拟 create，满足当前用例即可
  async create(): Promise<ContactCreateResult> {
    return {
      logId: 'test-log-id',
      storage: 'db',
    };
  }
}

describe('ContactController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        // 使用内存限流存储，避免依赖 Redis
        ThrottlerModule.forRoot([
          {
            ttl: 60_000,
            limit: 3,
          },
        ]),
      ],
      controllers: [ContactController],
      providers: [
        { provide: ContactService, useClass: FakeContactService },
        {
          provide: ConfigService,
          useValue: {
            get: () => undefined,
          },
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const validPayload = {
    name: '张三',
    phone: '13800138000',
    email: 'test@mupi.cn',
    message: '我想咨询一下项目合作。',
    website: '', // honeypot，应为空
    fromPage: '/contact',
    startedAt: Date.now() - 5_000,
  };

  it('should submit contact form successfully and wrap response', async () => {
    const res = await request(app.getHttpServer())
      .post('/contact')
      .send(validPayload)
      .expect(201);

    expect(res.body).toMatchObject({
      ok: true,
      code: 0,
      message: 'success',
      data: {
        logId: expect.any(String),
      },
    });
  });

  it('should return 429 when rate limit is exceeded', async () => {
    const server = app.getHttpServer();

    // 在限流窗口内多次请求，超过 limit=3
    await request(server).post('/contact').send(validPayload).expect(201);
    await request(server).post('/contact').send(validPayload).expect(201);
    await request(server).post('/contact').send(validPayload).expect(201);

    const res = await request(server)
      .post('/contact')
      .send(validPayload)
      .expect(429);

    expect(res.body.ok).toBe(false);
    expect(res.body.httpStatus).toBe(429);
    expect(res.body.code).toBe(429);
    expect(typeof res.body.message).toBe('string');
  });
}

