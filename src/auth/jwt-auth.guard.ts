import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';

type RequestWithUser = Request & { user?: { memberId?: string } };
type RequestWithAdmin = RequestWithUser & {
  adminUser?: string;
  adminRole?: string;
};

const ALLOWED_ADMIN_ROLES = new Set(['super', 'editor']);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    const rawPath =
      req.baseUrl?.toString() ||
      req.originalUrl?.toString() ||
      req.url?.toString() ||
      '';
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

    const isAdminRoute = path.startsWith('/api/admin/');

    if (isAdminRoute) {
      return this.handleAdminRoute(req, path);
    }

    // 非 admin 路由走标准 JWT 校验（会员接口等）
    const result = super.canActivate(context);

    if (result instanceof Promise) {
      return result.then((ok) => {
        this.ensureMemberSelfAccess(context);
        return ok;
      });
    }

    this.ensureMemberSelfAccess(context);
    return result;
  }

  /**
   * Admin 路由鉴权：
   * 前端管理系统使用 cookie session（非 JWT），通过 Next.js 服务端代理调用后端。
   * Next.js 会在请求中带上 X-Admin-User + X-Internal-Secret。
   *
   * 验证逻辑：
   * 1. X-Admin-User 必须存在（标识操作者）
   * 2. X-Internal-Secret 必须匹配 INTERNAL_RPC_TOKEN/TOKENS（证明来自可信服务）
   * 3. 可选：ADMIN_TRUSTED_IPS 限制来源 IP
   *
   * RPC Token 验证通过后直接放行，不再要求 JWT Bearer Token。
   */
  private handleAdminRoute(req: RequestWithUser, path: string): boolean {
    const adminUser = (
      req.headers['x-admin-user'] as string | undefined
    )?.trim();
    const adminRole = (
      req.headers['x-admin-role'] as string | undefined
    )?.trim();
    const providedSecret = (
      req.headers['x-internal-secret'] as string | undefined
    )?.trim();

    const internalTokensRaw =
      this.config.get<string>('INTERNAL_RPC_TOKENS')?.trim() ?? '';
    const singleToken =
      this.config.get<string>('INTERNAL_RPC_TOKEN')?.trim() ?? '';

    const allowedSecrets = new Set<string>();
    if (internalTokensRaw) {
      internalTokensRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => allowedSecrets.add(t));
    }
    if (singleToken) {
      allowedSecrets.add(singleToken);
    }

    // 1. 必须有管理端身份标识
    if (!adminUser) {
      this.logger.warn(`[Auth] Missing X-Admin-User path=${path}`);
      throw new UnauthorizedException('缺少管理端身份');
    }

    // 2. 内部密钥必须已配置
    if (allowedSecrets.size === 0) {
      this.logger.error(
        '[Auth] INTERNAL_RPC_TOKEN(S) 未配置，拒绝 admin 路由访问',
      );
      throw new UnauthorizedException('管理端内部鉴权未配置');
    }

    // 3. 请求中的密钥必须匹配
    if (!providedSecret || !allowedSecrets.has(providedSecret)) {
      const ip = this.extractIp(req);
      this.logger.warn(`[Auth] Secret Mismatch from IP=${ip} path=${path}`);
      throw new UnauthorizedException('非法内部调用');
    }

    // 4. 可选：IP 白名单
    const trustedIpsRaw =
      this.config.get<string>('ADMIN_TRUSTED_IPS')?.trim() ?? '';
    if (trustedIpsRaw) {
      const ip = this.extractIp(req);
      const trustedIps = new Set(
        trustedIpsRaw
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      );
      if (!trustedIps.has(ip)) {
        this.logger.warn(
          `[Auth] Admin access from untrusted IP=${ip} path=${path}`,
        );
        throw new ForbiddenException('非法来源访问管理端接口');
      }
    }

    // role 白名单校验：防止伪造任意角色
    const safeRole = ALLOWED_ADMIN_ROLES.has(adminRole ?? '')
      ? adminRole!
      : 'editor';

    // 将 admin 身份信息注入 req，方便下游 controller 使用
    const adminReq = req as RequestWithAdmin;
    adminReq.adminUser = adminUser;
    adminReq.adminRole = safeRole;

    return true;
  }

  private extractIp(req: Request): string {
    const socketIp = req.socket.remoteAddress || req.ip || '';
    return this.normalizeIp(socketIp);
  }

  private normalizeIp(ip: string): string {
    const trimmed = (ip || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('::ffff:')) {
      return trimmed.slice('::ffff:'.length);
    }
    return trimmed;
  }

  private ensureMemberSelfAccess(context: ExecutionContext): void {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    const routeId = (req.params?.id ?? '').toString();
    const memberId = req.user?.memberId?.toString();

    const path =
      req.baseUrl?.toString() ||
      req.originalUrl?.toString() ||
      req.url?.toString() ||
      '';

    const isMemberRoute = path.startsWith('/api/member');

    if (isMemberRoute && routeId && memberId && routeId !== memberId) {
      throw new ForbiddenException('无权访问其他会员数据');
    }
  }
}
