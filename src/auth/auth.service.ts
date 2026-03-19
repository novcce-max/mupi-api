import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Member } from '../member/entities/member.entity';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

export interface AuthResult {
  access_token: string;
  memberId: string;
  nickname: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const phone = dto.phone.trim();
    const password = dto.password;
    const nickname = (dto.nickname ?? phone).trim();

    if (!phone || !password) {
      throw new UnauthorizedException('手机号和密码不能为空');
    }

    const existing = await this.memberRepo.findOne({ where: { phone } });
    if (existing) {
      throw new UnauthorizedException('该手机号已注册');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const member = this.memberRepo.create({
      phone,
      nickname: nickname || phone,
      passwordHash,
    });
    const saved = await this.memberRepo.save(member);

    const access_token = this.jwtService.sign({
      sub: saved.id,
      phone: saved.phone,
    });

    return {
      access_token,
      memberId: String(saved.id),
      nickname: saved.nickname,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const phone = dto.phone.trim();
    const password = dto.password;

    if (!phone || !password) {
      throw new UnauthorizedException('手机号和密码不能为空');
    }

    const member = await this.memberRepo.findOne({ where: { phone } });
    if (!member || !member.passwordHash) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const ok = await bcrypt.compare(password, member.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    member.lastLoginAt = new Date();
    await this.memberRepo.save(member);

    const access_token = this.jwtService.sign({
      sub: member.id,
      phone: member.phone,
    });

    return {
      access_token,
      memberId: String(member.id),
      nickname: member.nickname,
    };
  }

  async validatePayload(payload: { sub: string }): Promise<Member | null> {
    const member = await this.memberRepo.findOne({
      where: { id: payload.sub },
    });
    return member ?? null;
  }
}
