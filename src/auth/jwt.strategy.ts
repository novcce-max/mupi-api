import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  memberId: string;
  phone?: string;
  email?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'mupi-dev-secret-change-in-production',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      memberId: String(payload.sub),
      phone: payload.phone,
      email: payload.email,
    };
  }
}
