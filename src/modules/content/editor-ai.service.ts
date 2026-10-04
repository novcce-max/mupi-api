import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  chatCompletionAssistantText,
  hasOpenAiPath,
} from '../../common/openai-chat-completion';
import type { InlineAiMode } from './dto/inline-ai-suggestion.dto';

export type InlineAiSuggestionResult = {
  seoTitle: string;
  seoDescription: string;
  summary: string;
  extraParagraph: string;
  provider: 'openai' | 'stub';
  model?: string;
};

const CONTENT_SNIP_MAX = 12_000;

@Injectable()
export class EditorAiService {
  private readonly log = new Logger(EditorAiService.name);

  constructor(private readonly config: ConfigService) {}

  private stubSuggest(
    mode: InlineAiMode,
    title: string,
    summary: string,
    contentText: string,
  ): InlineAiSuggestionResult {
    let seoTitle = '';
    let seoDescription = '';
    let outSummary = '';
    let extraParagraph = '';

    if (mode === 'optimize-seo') {
      seoTitle = title ? `${title}｜木皮施工与选材指南` : '木皮施工与选材指南';
      const base = summary || contentText;
      seoDescription = (base || '').slice(0, 120);
    } else if (mode === 'summarize') {
      const base = summary || contentText || title;
      outSummary = (base || '').slice(0, 150);
    } else if (mode === 'expand-content') {
      extraParagraph =
        '在实际项目中，木皮选材不仅要看纹理和颜色，还需要结合基层板材、胶水体系以及施工环境综合评估。例如大面积墙面或高光照区域，更需要提前通过打样确认色差范围与工艺窗口，并将批次资料与验收口径写入项目文档，以降低返工与争议风险。';
    }

    return {
      seoTitle,
      seoDescription,
      summary: outSummary,
      extraParagraph,
      provider: 'stub',
    };
  }

  async suggest(params: {
    mode: InlineAiMode;
    title?: string;
    summary?: string;
    contentText?: string;
  }): Promise<InlineAiSuggestionResult> {
    const title = (params.title || '').trim();
    const summary = (params.summary || '').trim();
    const contentText = (params.contentText || '')
      .trim()
      .slice(0, CONTENT_SNIP_MAX);
    const mode = params.mode;

    if (!hasOpenAiPath(this.config)) {
      return this.stubSuggest(mode, title, summary, contentText);
    }

    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini';

    const modeInstruction =
      mode === 'optimize-seo'
        ? '任务：根据下方素材生成中文 SEO。仅填充 seoTitle、seoDescription；summary 与 extraParagraph 固定为 "" 空字符串。seoTitle 建议 ≤36 个汉字且含站点调性但不堆砌关键词；seoDescription 建议 80–160 汉字，平实可点击、避免绝对化承诺。'
        : mode === 'summarize'
          ? '任务：根据正文/摘要写一段「文章摘要」仅供编辑参考。仅填充 summary（120–220 汉字）；seoTitle、seoDescription、extraParagraph 均为 "" 空字符串。'
          : '任务：写一段可追加到文末的正文扩展（Plain text，一段）。仅填充 extraParagraph（150–320 汉字），衔接木皮选材/施工/验收语境、专业克制；seoTitle、seoDescription、summary 均为 "" 空字符串。';

    const userBlob = [
      `标题：${title || '（空）'}`,
      `已有摘要：${summary || '（空）'}`,
      `正文摘录：${contentText || '（空）'}`,
    ].join('\n');

    const system = `你是 Mupi.cn（木皮选材与交付）后台编辑助手。只输出一个 JSON 对象，键名必须齐全：seoTitle, seoDescription, summary, extraParagraph；未使用的键必须是空字符串 ""。不要 markdown，不要解释。${modeInstruction}`;

    let text: string;
    try {
      text = await chatCompletionAssistantText(this.config, {
        model,
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userBlob },
        ],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed';
      this.log.warn(`Editor AI completion failed: ${msg}`);
      return this.stubSuggest(mode, title, summary, contentText);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return this.stubSuggest(mode, title, summary, contentText);
    }

    const str = (k: string) =>
      typeof parsed[k] === 'string' ? parsed[k].trim() : '';

    return {
      seoTitle: str('seoTitle').slice(0, 220),
      seoDescription: str('seoDescription').slice(0, 500),
      summary: str('summary').slice(0, 2000),
      extraParagraph: str('extraParagraph').slice(0, 4000),
      provider: 'openai',
      model,
    };
  }
}
