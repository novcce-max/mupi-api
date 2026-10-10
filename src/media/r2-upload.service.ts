import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const ALLOWED_MIME = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

@Injectable()
export class R2UploadService {
  private readonly log = new Logger(R2UploadService.name);
  private client: S3Client | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    const endpoint = this.config.get<string>('R2_ENDPOINT')?.trim();
    const keyId = this.config.get<string>('R2_ACCESS_KEY_ID')?.trim();
    const secret = this.config.get<string>('R2_SECRET_ACCESS_KEY')?.trim();
    const bucket = this.config.get<string>('R2_BUCKET')?.trim();
    return Boolean(endpoint && keyId && secret && bucket);
  }

  private getClient(): S3Client {
    if (this.client) return this.client;
    const endpoint = this.config.get<string>('R2_ENDPOINT')?.trim();
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config
      .get<string>('R2_SECRET_ACCESS_KEY')
      ?.trim();
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException(
        'R2 图床未配置（缺少密钥或 endpoint）',
      );
    }
    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
    return this.client;
  }

  /**
   * 上传至 R2，返回自定义域名下的公网 URL（R2_PUBLIC_BASE_URL，如 https://img.mupi.cn）
   */
  async uploadImage(params: {
    buffer: Buffer;
    mimeType: string;
    originalName?: string;
  }): Promise<{ url: string; key: string; contentType: string }> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'R2 图床未启用：请配置 R2_ENDPOINT、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY、R2_BUCKET、R2_PUBLIC_BASE_URL',
      );
    }

    const mime = params.mimeType.toLowerCase().split(';')[0]?.trim() ?? '';
    const ext = ALLOWED_MIME.get(mime);
    if (!ext) {
      throw new BadRequestException(
        `不支持的图片类型：${params.mimeType}，允许：${[...ALLOWED_MIME.keys()].join(', ')}`,
      );
    }

    const bucket = this.config.get<string>('R2_BUCKET')!.trim();
    const publicBase = (
      this.config.get<string>('R2_PUBLIC_BASE_URL')?.trim() ||
      'https://img.mupi.cn'
    ).replace(/\/+$/, '');

    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const key = `uploads/${y}/${m}/${randomUUID()}.${ext}`;

    const client = this.getClient();
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: params.buffer,
          ContentType: mime,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`R2 PutObject failed: ${msg}`);
      throw new ServiceUnavailableException('图床上传失败，请稍后重试');
    }

    const url = `${publicBase}/${key}`;
    return { url, key, contentType: mime };
  }

  /**
   * 列出桶内 uploads/ 前缀对象，供后台图库与本地 file 列表字段对齐。
   * （与 uploadImage 的 key 形如 uploads/{y}/{m}/{uuid}.ext 一致）
   */
  async listGalleryObjects(): Promise<
    Array<{
      name: string;
      url: string;
      size: number;
      createdAt: string;
    }>
  > {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'R2 图床未启用：请配置 R2_ENDPOINT、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY、R2_BUCKET、R2_PUBLIC_BASE_URL',
      );
    }
    const bucket = this.config.get<string>('R2_BUCKET')!.trim();
    const publicBase = (
      this.config.get<string>('R2_PUBLIC_BASE_URL')?.trim() ||
      'https://img.mupi.cn'
    ).replace(/\/+$/, '');
    const client = this.getClient();
    const out: Array<{
      name: string;
      url: string;
      size: number;
      createdAt: string;
    }> = [];
    let continuationToken: string | undefined;
    const maxTotal = 5000;
    do {
      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: 'uploads/',
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of res.Contents ?? []) {
        if (!obj.Key || obj.Key.endsWith('/')) continue;
        const base = obj.Key.split('/').pop();
        if (!base) continue;
        out.push({
          name: base,
          url: `${publicBase}/${obj.Key}`,
          size: Number(obj.Size ?? 0),
          createdAt: (obj.LastModified ?? new Date(0)).toISOString(),
        });
      }
      continuationToken = res.IsTruncated
        ? res.NextContinuationToken
        : undefined;
    } while (continuationToken && out.length < maxTotal);

    return out.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /** 按图库列表里的文件名删除。name 只是对象键最后一段。 */
  async deleteByFileName(fileName: string): Promise<void> {
    const safe = fileName.split('/').pop()?.trim() ?? '';
    if (!safe || safe.includes('..')) {
      throw new BadRequestException('无效文件名');
    }
    const objects = await this.listGalleryObjects();
    const match = objects.find((item) => item.name === safe);
    if (!match) {
      throw new NotFoundException('图片不存在或已删除');
    }
    let key = '';
    try {
      key = decodeURIComponent(new URL(match.url).pathname.replace(/^\//, ''));
    } catch {
      throw new BadRequestException('无法解析图片地址');
    }
    if (!key.startsWith('uploads/')) {
      throw new BadRequestException('只能删除图库 uploads 下的图片');
    }
    const bucket = this.config.get<string>('R2_BUCKET')!.trim();
    await this.getClient().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }
}
