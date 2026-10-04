import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Nest ConfigModule 要加载的 env 文件列表（后者覆盖前者）。
 * 与仓库根目录 `ENV.md` 约定一致，避免本地误改 `.env.production`、却加载不到 `.env.development`。
 *
 * - `NODE_ENV === 'production'`：`.env.production`（若存在）→ `.env`（若存在）
 * - 其它（含 `npm run start:dev` 未显式导出 NODE_ENV 时由 fix-and-run 设为 development）：`.env.development`（若存在）→ `.env`（若存在）
 * - `VERCEL=1`：不读任何 env 文件，只用平台注入的变量
 * - 无任何文件时不读盘，仅占位 `process.env`（Docker / PaaS 注入变量）
 */
export function resolveMupiApiEnvFilePaths(): string[] {
  // Vercel 注入环境变量。忽略仓库里的 .env.production，避免函数连回阿里云内网库。
  if (process.env.VERCEL === '1') return [];

  const root = process.cwd();
  const pick = (rel: string): string | null =>
    existsSync(join(root, rel)) ? rel : null;

  const isProd = process.env.NODE_ENV === 'production';
  const out: string[] = [];

  if (isProd) {
    const prod = pick('.env.production');
    if (prod) out.push(prod);
  } else {
    const dev = pick('.env.development');
    if (dev) {
      out.push(dev);
    } else {
      const legacy = pick('.env.production');
      if (legacy) out.push(legacy);
    }
  }

  const base = pick('.env');
  if (base) out.push(base);

  return out;
}
