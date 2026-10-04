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

    const path = this.resolveHttpPath(req);

    /** 与 @Controller('admin/...') 一致；CMS 内容模块为 @Controller('content')，写操作走 /api/content */
    const useInternalAdmin =
      path.startsWith('/api/admin/') ||
      this.isContentCmsInternalRoute(req, path);

    if (useInternalAdmin) {
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

  /** 优先 originalUrl，避免 baseUrl 仅为 /api 时路径不完整 */
  private resolveHttpPath(req: Request): string {
    const fromOriginal = (req.originalUrl || '').split('?')[0] || '';
    if (fromOriginal) {
      return fromOriginal.startsWith('/') ? fromOriginal : `/${fromOriginal}`;
    }
    const base = (req.baseUrl || '').toString();
    const url = (req.url || '').split('?')[0] || '';
    const combined = `${base}${url}`;
    const normalized = combined.startsWith('/') ? combined : `/${combined}`;
    return normalized || '/';
  }

  /**
   * ContentController：列表与 slug 详情 GET 公开；按 id 的 GET 对匿名仅返回已发布，
   * 带齐 X-Admin-User + X-Internal-Secret（与 handleAdminRoute 同规则）时可读草稿。
   * POST/PATCH/DELETE 带 JwtAuthGuard，由 Next 代理走内部管理鉴权而非会员 JWT。
   */
  private isContentCmsInternalRoute(req: Request, path: string): boolean {
    const method = (req.method || '').toUpperCase();
    const clean = path.split('?')[0];
    if (method === 'POST' && clean === '/api/content') {
      return true;
    }
    if (method === 'POST' && clean === '/api/content/ai/inline-suggestions') {
      return true;
    }
    if (method === 'POST' && clean === '/api/media/upload') {
      return true;
    }
    if (method === 'GET' && clean === '/api/media/list') {
      return true;
    }
    if (method === 'PATCH' || method === 'DELETE') {
      return /^\/api\/content\/\d+$/.test(clean);
    }
    return false;
  }

  /** req.ip 在 trust proxy 开启时为客户端真实 IP（Vercel / Nginx 后面必须如此）。 */
  private extractIp(req: Request): string {
    const ip = req.ip || req.socket.remoteAddress || '';
    return this.normalizeIp(ip);
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
