import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

function extractIp(req: Request): string {
  // req.ip 在 trust proxy 开启时为客户端真实 IP
  const ip = req.ip || req.socket.remoteAddress || '';
  const trimmed = (ip || '').trim();
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice('::ffff:'.length);
  }
  return trimmed;
}

/**
 * 与 JwtAuthGuard.handleAdminRoute 对齐：带齐 X-Admin-User + X-Internal-Secret（及可选 IP 白名单）时视为可信管理端调用。
 * 用于个别「未挂 Guard」的 GET（如 CMS 按 id 拉详情）区分草稿可见性。
 */
export function isTrustedInternalAdminRequest(
  req: Request,
  config: ConfigService,
): boolean {
  const adminUser = (req.headers['x-admin-user'] as string | undefined)?.trim();
  const providedSecret = (
    req.headers['x-internal-secret'] as string | undefined
  )?.trim();

  if (!adminUser || !providedSecret) {
    return false;
  }

  const internalTokensRaw =
    config.get<string>('INTERNAL_RPC_TOKENS')?.trim() ?? '';
  const singleToken = config.get<string>('INTERNAL_RPC_TOKEN')?.trim() ?? '';
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

  if (allowedSecrets.size === 0 || !allowedSecrets.has(providedSecret)) {
    return false;
  }

  const trustedIpsRaw = config.get<string>('ADMIN_TRUSTED_IPS')?.trim() ?? '';
  if (trustedIpsRaw) {
    const ip = extractIp(req);
    const trustedIps = new Set(
      trustedIpsRaw
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    );
    if (!trustedIps.has(ip)) {
      return false;
    }
  }

  return true;
}
