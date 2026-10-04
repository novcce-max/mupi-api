import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  chatCompletionAssistantText,
  hasOpenAiPath,
} from '../common/openai-chat-completion';
import { buildVeneerExtractionPrompt } from './veneer-extract.prompt';
import { htmlToPlainText } from './html-to-plain-text';
import { normalizeVeneerExtracted } from './veneer-maps';
import { isPublicHttpUrlForFetch } from './url-fetch.util';
import type { VeneerExtractedRaw } from './veneer.types';

function parseJsonObjectFromModel(text: string): Record<string, unknown> {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  }
  return JSON.parse(t) as Record<string, unknown>;
}

@Injectable()
export class VeneerExtractService {
  private readonly log = new Logger(VeneerExtractService.name);

  constructor(private readonly config: ConfigService) {}

  async fetchPlainTextFromUrl(sourceUrl: string): Promise<string> {
    if (!isPublicHttpUrlForFetch(sourceUrl)) {
      throw new BadRequestException(
        'sourceUrl 非允许的公网 http(s) 地址，或命中内网/本地防护',
      );
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20_000);
    try {
      const res = await fetch(sourceUrl, {
        signal: ctrl.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; MupiVeneerBot/1.0; +https://www.mupi.cn)',
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });
      if (!res.ok) {
        throw new BadRequestException(`抓取失败 HTTP ${res.status}`);
      }
      const html = await res.text();
      if (html.length > 2_000_000) {
        throw new BadRequestException('页面过大，请改用粘贴正文');
      }
      const plain = htmlToPlainText(html);
      if (plain.length < 40) {
        throw new BadRequestException('未能从页面解析出足够正文，请粘贴原文');
      }
      return plain;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`fetch url failed: ${msg}`);
      throw new BadRequestException(`抓取链接失败: ${msg}`);
    } finally {
      clearTimeout(t);
    }
  }

  async extractFromPlainText(plainText: string): Promise<{
    rawAi: Record<string, unknown>;
    normalized: VeneerExtractedRaw;
  }> {
    const text = plainText.trim();
    if (text.length < 20) {
      throw new BadRequestException('原文过短，至少 20 字');
    }
    if (!hasOpenAiPath(this.config)) {
      throw new ServiceUnavailableException(
        '未配置 MUPI_AI_LLM_URL 或 OPENAI_API_KEY，无法抽取',
      );
    }

    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini';

    let assistantText: string;
    try {
      assistantText = await chatCompletionAssistantText(this.config, {
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: buildVeneerExtractionPrompt(text),
          },
        ],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`Veneer extraction LLM error: ${msg}`);
      throw new ServiceUnavailableException(msg);
    }

    let raw: Record<string, unknown>;
    try {
      raw = parseJsonObjectFromModel(assistantText);
    } catch {
      throw new BadRequestException('AI 返回非合法 JSON');
    }

    return { rawAi: raw, normalized: normalizeVeneerExtracted(raw) };
  }
}
