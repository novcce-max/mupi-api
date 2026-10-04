import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomInt } from 'crypto';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Member } from '../member/entities/member.entity';
import { MailService } from '../mail/mail.service';
import { AuthEmailOtp } from './entities/auth-email-otp.entity';
import { AuthPasswordReset } from './entities/auth-password-reset.entity';
import type { RegisterCompleteDto } from './dto/register-complete.dto';
import type { LoginDto } from './dto/login.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';

export interface AuthResult {
  access_token: string;
  memberId: string;
  nickname: string;
  /** 邮箱账号；历史手机号登录时可能为 null */
  email: string | null;
}

const OTP_PURPOSE_REGISTER = 'register';
const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    @InjectRepository(AuthEmailOtp)
    private readonly otpRepo: Repository<AuthEmailOtp>,
    @InjectRepository(AuthPasswordReset)
    private readonly resetRepo: Repository<AuthPasswordReset>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private normalizeEmail(raw: string): string {
    return raw.trim().toLowerCase();
  }

  private signToken(member: Member): string {
    return this.jwtService.sign({
      sub: member.id,
      email: member.email ?? undefined,
      phone: member.phone ?? undefined,
    });
  }

  private buildPublicSiteUrl(): string {
    const fromEnv =
      process.env.MEMBER_PUBLIC_ORIGIN?.trim() ||
      process.env.PUBLIC_SITE_URL?.trim() ||
      'https://www.mupi.cn';
    return fromEnv.replace(/\/$/, '');
  }

  private randomDigits6(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private getOtpTemplateVariant(): 'rich' | 'plain' {
    const raw = (process.env.OTP_MAIL_TEMPLATE || '').trim().toLowerCase();
    return raw === 'plain' ? 'plain' : 'rich';
  }

  private buildRegisterOtpMail(code: string): {
    subject: string;
    text: string;
    html: string;
  } {
    const subject = `【MUPI】验证码 ${code}（10分钟内有效）`;
    const variant = this.getOtpTemplateVariant();
    if (variant === 'plain') {
      return {
        subject,
        text: `【MUPI】验证码：${code}
有效期 10 分钟。请勿泄露给他人。
若非本人操作，请忽略此邮件。`,
        html: `<pre style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;line-height:1.6;color:#171717;white-space:pre-wrap;">【MUPI】验证码：${code}
有效期 10 分钟。请勿泄露给他人。
若非本人操作，请忽略此邮件。</pre>`,
      };
    }

    return {
      subject,
      text: `【MUPI】邮箱验证码：${code}

验证码 10 分钟内有效，请勿泄露给他人。
若非本人操作，请忽略此邮件。`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#171717;line-height:1.65;">
<p style="margin:0 0 12px;font-size:14px;">此邮件用于账号安全验证。</p>
<p style="margin:0 0 8px;font-size:14px;">您的验证码：</p>
<p style="margin:0 0 14px;font-size:26px;font-weight:700;letter-spacing:0.16em;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${code}</p>
<p style="margin:0 0 6px;font-size:13px;color:#525252;">有效期：10 分钟。请勿泄露给他人。</p>
<p style="margin:0;font-size:12px;color:#737373;">若非本人操作，请忽略此邮件。</p>
</div>`,
    };
  }

  private hashResetToken(raw: string): string {
    return createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  /** 将「缺表/缺列」转为可读提示，避免前端只看到 Internal server error */
  private rethrowIfSchemaMissing(e: unknown, context: string): void {
    if (!(e instanceof QueryFailedError)) {
      return;
    }
    const driver = e.driverError as
      | { code?: string; message?: string }
      | undefined;
    const code = driver?.code;
    const combined = `${e.message} ${driver?.message ?? ''}`;
    if (
      code === '42P01' ||
      code === '42703' ||
      /relation\s+"(auth_email_otps|auth_password_resets)"/i.test(combined) ||
      /"auth_email_otps"/i.test(combined) ||
      /column\s+[^\s]+\s+of\s+relation\s+\"members\"/i.test(combined) ||
      /column\s+.*does not exist/i.test(combined)
    ) {
      throw new HttpException(
        `${context}：数据库尚未补齐会员邮箱/验证码相关表或列。请在服务器执行 scripts/migrations/20260404_member_email_auth.sql（若已无 auth_email_otps 可再执行 20260408_admin_auth_missing_tables.sql 仅补索引）后重启 API。`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async sendRegisterCode(emailRaw: string): Promise<{ ok: true }> {
    const email = this.normalizeEmail(emailRaw);

    try {
      const existing = await this.memberRepo.findOne({
        where: { email },
      });
      if (existing) {
        throw new BadRequestException('该邮箱已注册，请直接登录');
      }

      await this.otpRepo.update(
        {
          email,
          purpose: OTP_PURPOSE_REGISTER,
          consumedAt: IsNull(),
        },
        { consumedAt: new Date() },
      );

      const code = this.randomDigits6();
      const codeHash = await bcrypt.hash(code, 8);
      const row = this.otpRepo.create({
        email,
        purpose: OTP_PURPOSE_REGISTER,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        consumedAt: null,
      });
      await this.otpRepo.save(row);

      const otpMail = this.buildRegisterOtpMail(code);

      await this.mailService.send({
        to: email,
        subject: otpMail.subject,
        text: otpMail.text,
        html: otpMail.html,
      });

      return { ok: true };
    } catch (e) {
      if (
        e instanceof BadRequestException ||
        e instanceof UnauthorizedException ||
        e instanceof BadGatewayException ||
        e instanceof HttpException
      ) {
        throw e;
      }
      this.rethrowIfSchemaMissing(e, '无法发送验证码');
      if (e instanceof QueryFailedError) {
        this.logger.error(`sendRegisterCode DB: ${e.message}`, e.stack);
        throw new HttpException(
          '发送验证码失败：数据库异常。请核对是否已执行会员相关迁移，或联系管理员查看 API 日志。',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      this.logger.error(
        `sendRegisterCode unexpected: ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
      throw new HttpException(
        '发送验证码失败，请稍后重试。若刚部署新版本，请确认数据库迁移与 SMTP 已按 ENV 配置完成。',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async registerComplete(dto: RegisterCompleteDto): Promise<AuthResult> {
    const email = this.normalizeEmail(dto.email);
    const password = dto.password;
    const nickname = (dto.nickname ?? email.split('@')[0] ?? '会员').trim();

    const existing = await this.memberRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('该邮箱已注册');
    }

    const otp = await this.otpRepo.findOne({
      where: {
        email,
        purpose: OTP_PURPOSE_REGISTER,
        consumedAt: IsNull(),
      },
      order: { id: 'DESC' },
    });

    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('验证码已过期，请重新获取');
    }

    const codeOk = await bcrypt.compare(dto.code, otp.codeHash);
    if (!codeOk) {
      throw new UnauthorizedException('验证码错误');
    }

    otp.consumedAt = new Date();
    await this.otpRepo.save(otp);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const member = this.memberRepo.create({
      email,
      phone: null,
      nickname: nickname || email.split('@')[0],
      passwordHash,
    });
    const saved = await this.memberRepo.save(member);

    const access_token = this.signToken(saved);

    return {
      access_token,
      memberId: String(saved.id),
      nickname: saved.nickname,
      email: saved.email ?? null,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const raw = dto.identifier.trim();
    const password = dto.password;

    if (!raw || !password) {
      throw new UnauthorizedException('账号或密码错误');
    }

    let member: Member | null = null;
    if (raw.includes('@')) {
      member = await this.memberRepo.findOne({
        where: { email: this.normalizeEmail(raw) },
      });
    } else {
      member = await this.memberRepo.findOne({ where: { phone: raw } });
    }

    if (!member || !member.passwordHash) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const ok = await bcrypt.compare(password, member.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('账号或密码错误');
    }

    member.lastLoginAt = new Date();
    await this.memberRepo.save(member);

    const access_token = this.signToken(member);

    return {
      access_token,
      memberId: String(member.id),
      nickname: member.nickname,
      email: member.email ?? null,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ ok: true }> {
    const email = this.normalizeEmail(dto.email);
    const member = await this.memberRepo.findOne({ where: { email } });
    if (!member) {
      // 防枚举：仍返回成功
      return { ok: true };
    }

    await this.resetRepo.update(
      { memberId: member.id, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );

    const rawToken = createHash('sha256')
      .update(`${member.id}:${Date.now()}:${randomInt(1e9, 1e10)}`)
      .digest('hex');
    const tokenHash = this.hashResetToken(rawToken);

    const row = this.resetRepo.create({
      memberId: member.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
      consumedAt: null,
    });
    await this.resetRepo.save(row);

    const base = this.buildPublicSiteUrl();
    const link = `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;

    const resetText = `【MUPI】密码重置通知

请在 1 小时内访问下方链接重置密码：
${link}

若非本人操作，请忽略此邮件。`;

    await this.mailService.send({
      to: email,
      subject: '【MUPI】密码重置链接（1小时内有效）',
      text: resetText,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#171717;line-height:1.65;">
<p style="margin:0 0 14px;font-size:14px;">此邮件用于账号安全操作。</p>
<p style="margin:0 0 16px;font-size:14px;">请在 1 小时内点击下方按钮完成密码重置：</p>
<p style="margin:0 0 16px;"><a href="${link}" style="display:inline-block;padding:10px 20px;background:#171717;color:#fafafa;text-decoration:none;font-size:14px;border-radius:6px;">重置密码</a></p>
<p style="margin:0 0 10px;color:#525252;font-size:12px;word-break:break-all;">${link}</p>
<p style="margin:0;font-size:12px;color:#737373;">若非本人操作，请忽略此邮件。</p>
</div>`,
    });

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: true }> {
    const tokenHash = this.hashResetToken(dto.token.trim());

    const row = await this.resetRepo.findOne({
      where: { tokenHash, consumedAt: IsNull() },
      order: { id: 'DESC' },
    });

    if (!row || row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('链接无效或已过期，请重新申请找回密码');
    }

    const member = await this.memberRepo.findOne({
      where: { id: row.memberId },
    });
    if (!member) {
      throw new BadRequestException('账户不存在');
    }

    const salt = await bcrypt.genSalt(10);
    member.passwordHash = await bcrypt.hash(dto.password, salt);
    await this.memberRepo.save(member);

    row.consumedAt = new Date();
    await this.resetRepo.save(row);

    return { ok: true };
  }

  async validatePayload(payload: { sub: string }): Promise<Member | null> {
    const member = await this.memberRepo.findOne({
      where: { id: payload.sub },
    });
    return member ?? null;
  }
}
