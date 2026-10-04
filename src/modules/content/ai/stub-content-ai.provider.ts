import type {
  ContentAiGenerateInput,
  ContentAiGeneratedPayload,
  ContentAiProvider,
} from './content-ai.types';
import {
  SITE_DRAFT_SCHEMA_VERSION,
  type SiteDraftEnvelope,
  slugHintOrDraft,
} from './site-draft.types';

function buildEnvelope(
  input: ContentAiGenerateInput,
  preview: { type: 'paragraph'; text: string }[],
  site: SiteDraftEnvelope['site'],
): SiteDraftEnvelope {
  return {
    schemaVersion: SITE_DRAFT_SCHEMA_VERSION,
    channel: input.channel,
    preview,
    site,
  };
}

export class StubContentAiProvider implements ContentAiProvider {
  generate(input: ContentAiGenerateInput): Promise<ContentAiGeneratedPayload> {
    const title = input.title.trim();
    const slug = slugHintOrDraft(input.slugHint, title);
    const label =
      input.channel === 'baike'
        ? '百科树种'
        : input.channel === 'mupi'
          ? '木皮选材'
          : '问题页';

    const preview: { type: 'paragraph'; text: string }[] = [
      {
        type: 'paragraph',
        text: `「${title}」${label}草稿（Stub）。接入 GPT 后 site 块将可被导入对应业务表。`,
      },
    ];
    if (input.brief?.trim()) {
      preview.push({
        type: 'paragraph',
        text: `写作要点：${input.brief.trim()}`,
      });
    }

    let envelope: SiteDraftEnvelope;

    if (input.channel === 'wenti') {
      envelope = buildEnvelope(input, preview, {
        kind: 'problem',
        slug,
        category: '症状',
        title,
        summary: `[占位] ${title}：先核对基层含水与压合参数，再决定局部修补或返工范围。`,
        heroTitle: title,
        heroSubtitle: '按工序排查原因，再选止损路径。',
        heroImage: '/images/case-wall.svg',
        symptoms: [
          {
            title: '典型表现',
            frequency: '占位',
            scene: '交付后高可见区域',
          },
        ],
        reasons: [
          '基层含水率与工艺窗口未对齐（占位）',
          '压合压力或开放时间不足（占位）',
        ],
        steps: [
          '拍摄整体与边位照片，标注异常范围是否扩大。',
          '核对胶水型号与木皮/基材匹配及开放时间与压力记录。',
          '小范围试修确认观感与附着力，再决定是否扩大处理面。',
        ],
        tools: ['含水率测试仪', '压辊'],
        materials: ['同批次木皮补片', '匹配胶水'],
        preventions: ['施工前书面确认样板与批次', '关键节点留影像记录'],
        faq: [
          {
            q: `${title}是否一定要整面拆除？`,
            a: '取决于异常是否稳定、是否持续扩散及基层状态；先止损再定范围。',
          },
        ],
        recommendedMaterialSlugs: [],
        tags: ['ai-draft', 'wenti'],
      });
    } else if (input.channel === 'baike') {
      envelope = buildEnvelope(input, preview, {
        kind: 'wiki_species',
        slug,
        name: title,
        englishName: null,
        category: '树种',
        description: `[占位] ${title}：纹理、稳定性与典型应用概述；发布前请核对参数与价格口径。`,
        photos: ['/images/wood-white-oak.svg'],
        suitableScenes: [
          {
            scene: '连续立面 / 高可见家具',
            advice: '先做小样墙对齐批次与拼缝策略。',
            risk: '色差与纹理方向对观感影响大。',
          },
        ],
        priceRange: null,
        properties: {
          subtitle: `${title}木皮导读（占位）`,
          aliases: [],
          sourceAndProcess: ['来源与切片方式占位：发布前补全。'],
          glueAndCraft: ['胶型与压合窗口占位。'],
          maintenance: ['日常维护占位。'],
          faq: [
            { q: '批次如何管理？', a: '占位：按项目锁定批次并留补货余量。' },
          ],
          seoTitle: title,
          seoDescription: `[占位] ${title}`,
          seoKeywords: [title, '木皮', 'MUPI'],
          references: [],
          relatedMaterialSlugs: [],
          relatedCaseSlugs: [],
          heroAlt: title,
          chineseName: title,
        },
        tags: ['ai-draft', 'baike'],
      });
    } else {
      envelope = buildEnvelope(input, preview, {
        kind: 'material',
        slug,
        name: title,
        colorGroup: '中性',
        textureType: '直纹',
        finish: null,
        thickness: '0.5mm（占位）',
        images: ['/images/wood-white-oak.svg'],
        properties: {
          aliases: [],
          englishName: '',
          category: '天然',
          texture: '直纹',
          color: '中性',
          usage: '家具立面 / 墙板（占位）',
          size: '2500×640mm（占位）',
          density: '',
          hardness: '',
          machinability: '',
          stability: '',
          processSuggestion: ['进场静置平衡含水率', '先做样板确认面漆影响'],
          maintenance: [],
          certification: [],
          priceRange: '发布前人工确认',
          intro: `[占位] ${title}选材说明。`,
          subtitle: `${title} · 占位副标题`,
          seoText: `${title} 木皮 MUPI`,
        },
        tags: ['ai-draft', 'mupi'],
      });
    }

    return Promise.resolve({
      title,
      summary: `[占位初稿 · ${label}] ${title}。site 已按前台实体结构预填，审核后可导入 problems / wiki_species / materials。`,
      seoTitle: title.slice(0, 220),
      seoDescription: `[占位] ${title}`.slice(0, 800),
      content: envelope,
      provider: 'stub',
    });
  }
}
