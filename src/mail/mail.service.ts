import {
  BadGatewayException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();
    if (!host) {
      this.logger.warn(
        '未配置 SMTP_HOST：会员验证码/找回密码邮件不会真正发出，仅日志预览正文。',
      );
      return;
    }
    if (!user || !pass) {
      this.logger.warn(
        '已配置 SMTP_HOST 但缺少 SMTP_USER 或 SMTP_PASS：发信会失败。阿里云企业邮请使用完整邮箱 + 三方客户端安全密码（非网页登录密码）。',
      );
    }
  }

  async send(opts: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const port = parseInt(this.config.get<string>('SMTP_PORT', '587'), 10);
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();
    const from =
      this.config.get<string>('MAIL_FROM')?.trim() ||
      this.config.get<string>('SMTP_FROM')?.trim() ||
      'noreply@mupi.cn';

    if (!host) {
      this.logger.warn(
        `[Mail] SMTP_HOST 未配置，跳过发信 to=${opts.to} subject=${opts.subject}`,
      );
      this.logger.warn(`[Mail] 正文预览:\n${opts.text}`);
      if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
        throw new BadGatewayException(
          '发信服务未配置（缺少 SMTP_HOST）。请在服务器环境变量中配置邮局后再试。',
        );
      }
      return;
    }

    if (!user?.trim() || !pass?.trim()) {
      this.logger.error(`[Mail] SMTP 已设主机但缺少账号或密码 to=${opts.to}`);
      throw new BadGatewayException(
        '发信参数不完整：请配置 SMTP_USER 与 SMTP_PASS（阿里云企业邮为「三方客户端安全密码」）。',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      name: this.config.get<string>('SMTP_HELO_NAME')?.trim() || 'mail.mupi.cn',
    });

    try {
      await transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html ?? opts.text.replace(/\n/g, '<br/>'),
        // 事务邮件头：降低被当营销信的概率
        headers: {
          'X-Auto-Response-Suppress': 'All',
          'X-Priority': '3',
          Precedence: 'bulk',
          'Auto-Submitted': 'auto-generated',
        },
      });
    } catch (err) {
      const hint = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Mail] SMTP 发信失败 to=${opts.to}: ${hint}`);
      throw new BadGatewayException(
        '邮件发送失败：请核对 SMTP 端口（阿里云企业邮为 465）、账号与客户端安全密码，或稍后重试。',
      );
    }
  }
}
