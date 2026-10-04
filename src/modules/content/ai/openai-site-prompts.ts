import type { ContentChannel } from './content-ai.types';

const STYLE = `风格：工程化、可执行；少用「可能」「建议尝试」「一般来说」。
summary 约 200 字内；seoDescription 约 160 字内；heroImage / photos / images 可填占位路径如 /images/wood-white-oak.svg。`;

export function buildOpenAiSiteSystemPrompt(channel: ContentChannel): string {
  const header = `你是 MUPI.CN 木皮行业站点的内容编辑。输出单一 JSON 对象，不要 Markdown 围栏，不要多余说明。
顶层键必须包含：title, summary, seoTitle, seoDescription, schemaVersion(固定为2), channel(固定为"${channel}"), preview, site。

preview：数组，元素为 { "type": "paragraph", "text": "..." }，供运营快速浏览。

${STYLE}
`;

  if (channel === 'wenti') {
    return `${header}
site 对象必须含 kind:"problem"，并与后端 problems 表对齐，字段：
slug, category, title, summary, heroTitle, heroSubtitle, heroImage,
symptoms[{title,frequency,scene}], reasons[], steps[], tools[], materials[], preventions[], faq[{q,a}], recommendedMaterialSlugs[], tags[]。
steps 写可执行编号步骤；faq 3～6 条。`;
  }

  if (channel === 'baike') {
    return `${header}
site 对象必须含 kind:"wiki_species"，与 wiki_species 表及前台百科详情对齐：
slug, name, englishName(可 null), category, description, photos(字符串数组),
suitableScenes[{scene,advice,risk}], priceRange(可 null), properties(对象), tags[]。

properties 内建议含：subtitle, aliases[], sourceAndProcess[], glueAndCraft[], maintenance[],
faq[{q,a}], seoKeywords[], references[], relatedMaterialSlugs[], relatedCaseSlugs[],
heroAlt, chineseName(可与 name 相同)。`;
  }

  return `${header}
site 对象必须含 kind:"material"，与 materials 表及前台 /mupi/[shuzong] 对齐：
slug, name, colorGroup(深色|中性|浅色 之一), textureType, finish, thickness, images(字符串数组), properties(对象), tags[]。

properties 内建议含：aliases[], englishName, category(天然|科技|染色), texture, color, usage, size, density, hardness, machinability, stability,
processSuggestion[], maintenance[], certification[], priceRange, intro, subtitle, seoText 等与选材详情相关的展示字段。`;
}
