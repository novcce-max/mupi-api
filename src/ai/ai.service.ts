import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type MupiAiWikiPayload = {
  wiki: Record<string, unknown>;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  private getGenerateUrl(): string {
    return this.configService.get<string>('MUPI_AI_GENERATE_URL')?.trim() ?? '';
  }

  /**
   * 调用 Vercel 上的 mupi-ai /api/generate，生成木皮百科结构化草稿（JSON）。
   */
  async generateWikiDraft(
    topic: string,
    context?: string,
  ): Promise<MupiAiWikiPayload> {
    const url = this.getGenerateUrl();
    if (!url) {
      throw new BadRequestException(
        'MUPI_AI_GENERATE_URL is not configured (e.g. https://xxx.vercel.app/api/generate)',
      );
    }

    const payload: { topic: string; context?: string } = {
      topic: topic.trim(),
    };
    if (context?.trim()) {
      payload.context = context.trim();
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(55_000),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed';
      this.logger.warn(`mupi-ai request failed: ${msg}`);
      throw new ServiceUnavailableException(
        `Mupi AI service unreachable: ${msg}`,
      );
    }

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      this.logger.warn(
        `mupi-ai non-JSON response (${res.status}): ${text.slice(0, 200)}`,
      );
      throw new ServiceUnavailableException('Mupi AI returned invalid JSON');
    }

    if (!res.ok) {
      const errMsg =
        data &&
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as { error: unknown }).error === 'string'
          ? (data as { error: string }).error
          : `HTTP ${res.status}`;
      this.logger.warn(`mupi-ai error: ${errMsg}`);
      throw new ServiceUnavailableException(errMsg);
    }

    if (
      !data ||
      typeof data !== 'object' ||
      !('wiki' in data) ||
      typeof (data as { wiki: unknown }).wiki !== 'object' ||
      (data as { wiki: unknown }).wiki === null
    ) {
      throw new ServiceUnavailableException(
        'Mupi AI response missing wiki object',
      );
    }

    return { wiki: (data as { wiki: Record<string, unknown> }).wiki };
  }
}
