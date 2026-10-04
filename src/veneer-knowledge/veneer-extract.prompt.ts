const EXTRACTION_SCHEMA = `{
  "name": "木皮中文名",
  "latinName": "拉丁名或空字符串",
  "origin": "产地或空字符串",
  "color": "颜色描述或空字符串",
  "grain": "直纹 | 山纹 | 波纹 | 斑纹 之一，无法判断则空字符串",
  "patternDescription": "原文对纹理的描述或空字符串",
  "thicknessRange": "厚度范围如 0.2-0.6，单位 mm 在字段含义中体现，无则空字符串",
  "hardness": "硬度描述或空字符串",
  "stability": "稳定 | 易开裂 | 一般 之一，无则空字符串",
  "moistureSensitivity": "吸湿相关描述或空字符串",
  "usage": ["家具","门板","定制","工艺品"] 的子集，仅填文中明确支持的，无则 [],
  "recommendedFinishes": ["清漆"] 这类短语列表，无则 [],
  "priceLevel": "高 | 中 | 低 之一，无则空字符串",
  "rarity": "常见 | 稀有 | 特殊 之一，无则空字符串",
  "tags": ["标签"],
}`;

export function buildVeneerExtractionPrompt(articlePlainText: string): string {
  const body = articlePlainText.trim().slice(0, 48_000);
  return `你是一个木皮百科信息抽取助手。
请从以下原文中提取木皮相关信息，只输出一个 JSON 对象（不要 markdown，不要解释），键必须齐全且与下面示例结构一致：

${EXTRACTION_SCHEMA}

要求：
1. 信息缺失的字符串字段用 ""，数组用 []
2. 不要编造原文没有出现或无法合理推断的信息；不确定则留空
3. grain / stability / priceLevel / rarity / usage 必须使用该字段说明中的枚举字面值之一，否则用 "" 或 []

原文：
${body}`;
}
