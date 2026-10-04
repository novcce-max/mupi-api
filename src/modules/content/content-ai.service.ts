import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_AI_PROVIDER } from './ai/content-ai.provider.token';
import type { ContentAiProvider } from './ai/content-ai.types';
import { SITE_DRAFT_SCHEMA_VERSION } from './ai/site-draft.types';
import { ContentService } from './content.service';
import { GenerateContentDraftDto } from './dto/generate-content-draft.dto';

@Injectable()
export class ContentAiService {
  constructor(
    @Inject(CONTENT_AI_PROVIDER)
    private readonly ai: ContentAiProvider,
    private readonly content: ContentService,
  ) {}

  async createDraftFromAi(dto: GenerateContentDraftDto) {
    const payload = await this.ai.generate({
      channel: dto.channel,
      title: dto.title,
      brief: dto.brief,
      slugHint: dto.slug,
    });

    return this.content.create({
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
      slug: dto.slug,
      status: 'draft',
      channel: dto.channel,
      aiMeta: {
        provider: payload.provider,
        model: payload.model ?? null,
        generatedAt: new Date().toISOString(),
        promptVersion: 'content-ai-v2',
        siteSchemaVersion: SITE_DRAFT_SCHEMA_VERSION,
        targetEntity:
          dto.channel === 'baike'
            ? 'wiki_species'
            : dto.channel === 'mupi'
              ? 'materials'
              : 'problems',
      },
    });
  }
}
