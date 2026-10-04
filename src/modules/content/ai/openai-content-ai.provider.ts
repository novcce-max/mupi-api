import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  chatCompletionAssistantText,
  hasOpenAiPath,
} from '../../../common/openai-chat-completion';
import { buildOpenAiSiteSystemPrompt } from './openai-site-prompts';
import { buildEnvelopeFromOpenAi } from './site-draft.coerce';
import type {
  ContentAiGenerateInput,
  ContentAiGeneratedPayload,
  ContentAiProvider,
} from './content-ai.types';

function channelHint(ch: string): string {
  if (ch === 'baike') return '百科词条，偏权威与体系化说明。';
  if (ch === 'mupi') return '木皮/树种材料页，参数、场景、工艺与风险。';
  if (ch === 'wenti') return '问题/症状页：现象—原因—处理步骤—何时停工。';
  return ch;
}

function jsonScalarString(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

export class OpenAiContentAiProvider implements ContentAiProvider {
  private readonly log = new Logger(OpenAiContentAiProvider.name);

  constructor(private readonly config: ConfigService) {}

  async generate(
    input: ContentAiGenerateInput,
  ): Promise<ContentAiGeneratedPayload> {
    if (!hasOpenAiPath(this.config)) {
      throw new Error(
        '未配置 MUPI_AI_LLM_URL（境外转发）或 OPENAI_API_KEY（直连）',
      );
    }

    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini';
    const userParts = [
      `频道：${input.channel}（${channelHint(input.channel)}）`,
      `标题：${input.title.trim()}`,
    ];
    if (input.brief?.trim()) {
      userParts.push(`补充要点：${input.brief.trim()}`);
    }
    if (input.slugHint?.trim()) {
      userParts.push(`期望 slug：${input.slugHint.trim()}（写入 site.slug）`);
    }

    let text: string;
    try {
      text = await chatCompletionAssistantText(this.config, {
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: buildOpenAiSiteSystemPrompt(input.channel),
          },
          { role: 'user', content: userParts.join('\n') },
        ],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`Chat completion error: ${msg}`);
      throw new Error(msg);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error('OpenAI returned non-JSON content');
    }

    const envelope = buildEnvelopeFromOpenAi(parsed, {
      channel: input.channel,
      title: input.title.trim(),
      slugHint: input.slugHint,
    });

    const siteMainTitle =
      envelope.site.kind === 'problem'
        ? envelope.site.title
        : envelope.site.name;
    const finalTitle = (jsonScalarString(parsed.title) || siteMainTitle).slice(
      0,
      200,
    );

    let summary = jsonScalarString(parsed.summary).slice(0, 800);
    if (!summary) {
      if (envelope.site.kind === 'problem') {
        summary = envelope.site.summary.slice(0, 800);
      } else if (envelope.site.kind === 'wiki_species') {
        summary = envelope.site.description.slice(0, 800);
      } else {
        const intro = envelope.site.properties.intro;
        summary =
          typeof intro === 'string' && intro.trim()
            ? intro.trim().slice(0, 800)
            : envelope.site.name;
      }
    }
    const seoTitle = (jsonScalarString(parsed.seoTitle) || finalTitle).slice(
      0,
      220,
    );
    const seoDescription = (
      jsonScalarString(parsed.seoDescription) || summary
    ).slice(0, 800);

    return {
      title: finalTitle,
      summary,
      seoTitle,
      seoDescription,
      content: envelope,
      provider: 'openai',
      model,
    };
  }
}
