/**
 * 单文件上传上限（bytes）。可用 MEDIA_UPLOAD_MAX_BYTES 覆盖。
 * - Vercel Serverless 请求体约 4.5MB → 默认 4MB
 * - 自建 / 非 Vercel → 默认 12MB（上游 Next/浏览器会先压到约 3MB）
 */
export function getMediaUploadMaxBytes(): number {
  const raw = process.env.MEDIA_UPLOAD_MAX_BYTES?.trim();
  if (raw && /^\d+$/.test(raw)) return parseInt(raw, 10);
  if (process.env.VERCEL === '1') return 4 * 1024 * 1024;
  return 12 * 1024 * 1024;
}

export const MEDIA_UPLOAD_MAX_BYTES = getMediaUploadMaxBytes();
