import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type * as jwt from 'jsonwebtoken';

import { Member } from '../member/entities/member.entity';
import { MailModule } from '../mail/mail.module';
import { AuthEmailOtp } from './entities/auth-email-otp.entity';
import { AuthPasswordReset } from './entities/auth-password-reset.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    MailModule,
    TypeOrmModule.forFeature([Member, AuthEmailOtp, AuthPasswordReset]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const nodeEnv = config.get<string>('NODE_ENV');

        if (!secret && nodeEnv === 'production') {
          throw new Error(
            'JWT_SECRET is required in production. Please set JWT_SECRET environment variable.',
          );
        }

        const expiresIn = config.get<string>('JWT_EXPIRES_IN') ?? '7d';

        return {
          secret: secret || 'mupi-dev-secret-change-in-production',
          signOptions: {
            // nestjs/jwt 的类型为 jwt.SignOptions['expiresIn']，此处显式断言
            expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtStrategy],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
