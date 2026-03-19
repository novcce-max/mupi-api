import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../app.module';
import { AdminUser } from '../admin-user/entities/admin-user.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const repo = app.get(getRepositoryToken(AdminUser));

  const usernameEnv = process.env.ADMIN_USERNAME?.trim();
  const passwordEnv = process.env.ADMIN_PASSWORD?.trim();

  if (!usernameEnv || !passwordEnv) {
    console.error(
      '[seed-admin-user] ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment',
    );
    process.exit(1);
  }

  if (
    usernameEnv === 'admin' ||
    passwordEnv === 'mupi-admin' ||
    passwordEnv.length < 12
  ) {
    console.error(
      '[seed-admin-user] ADMIN_PASSWORD for superadmin must be strong (non-default, min 12 chars)',
    );
    process.exit(1);
  }

  const existing = await repo.findOne({ where: { username: usernameEnv } });
  if (existing) {
    console.log(
      `[seed-admin-user] Admin user "${usernameEnv}" already exists, skipping`,
    );
    await app.close();
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(passwordEnv, salt);

  const user = repo.create({
    username: usernameEnv,
    passwordHash,
    role: 'superadmin',
    isActive: true,
  });

  const saved = await repo.save(user);

  console.log(
    `[seed-admin-user] Created superadmin "${saved.username}" with id=${saved.id}`,
  );

  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
