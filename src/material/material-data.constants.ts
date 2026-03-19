/**
 * 材料种子数据，与前端 app/config/materials.ts 保持一致。
 * 用于 GET /api/materials/init-data 写入数据库。
 */
export type MaterialCategory = '天然' | '科技' | '染色';

export type MaterialSeedItem = {
  slug: string;
  aliases: string[];
  name: string;
  englishName: string;
  category: MaterialCategory;
  texture: string;
  color: string;
  colorGroup: '深色' | '中性' | '浅色';
  usage: string;
  thickness: string;
  size: string;
  density: string;
  hardness: string;
  machinability: string;
  stability: string;
  processSuggestion: string[];
  maintenance: string[];
  certification: string[];
  priceRange: string;
  intro: string;
  subtitle: string;
  image: string;
  detailImages: string[];
  tags: string[];
  seoText: string;
};

export const MATERIALS_SEED_DATA: MaterialSeedItem[] = [
  {
    slug: 'black-walnut',
    aliases: ['heihetao', 'hutao'],
    name: '黑胡桃木皮',
    englishName: 'Black Walnut Veneer',
    category: '天然',
    texture: '山纹 / 直纹',
    color: '深棕',
    colorGroup: '深色',
    usage: '门墙柜 / 商务空间',
    thickness: '0.45mm / 0.50mm',
    size: '2500x320mm',
    density: '0.63-0.69 g/cm3',
    hardness: 'Janka 1010 lbf',
    machinability: '易切割，边角收口稳定',
    stability: '高，适合中大面积立面',
    processSuggestion: [
      '建议使用热压贴合，控制温度在 55-65°C。',
      '边角位置采用二次压实，减少后期开边风险。',
      '搭配中高固含胶水，确保深色木皮附着力。',
    ],
    maintenance: [
      '使用中性清洁剂擦拭，避免强碱性溶剂。',
      '长期暴晒区域建议增加 UV 保护清漆。',
      '保持室内湿度 45%-65%，降低变形概率。',
    ],
    certification: ['FSC 可持续林业认证', 'E0 级胶合工艺兼容'],
    priceRange: '¥120 - ¥180 / 张',
    intro: '纹理层次丰富，适合高端家具木皮与大面积护墙项目。',
    subtitle: '北美 FAS 级天然木皮',
    image: '/images/wood-black-walnut.svg',
    detailImages: [
      '/images/wood-black-walnut.svg',
      '/images/case-office.svg',
      '/images/hero-wood.svg',
    ],
    tags: ['高端', '家具木皮', '商务空间'],
    seoText:
      '黑胡桃木皮是高端木皮销售中的核心品类，兼具深色质感与稳定结构，常用于家具木皮、墙板与门板项目。该材料纹理自然、层次清晰，能在现代商务与轻奢空间中呈现统一且高级的视觉效果。MUPI 提供黑胡桃木皮参数说明、施工建议与案例参考，支持打样、快速报价和工艺联调。对于需要兼顾外观、耐用性和批次一致性的项目，黑胡桃木皮在材质稳定性、加工适应性和空间适配度上都具有明显优势。',
  },
  {
    slug: 'white-oak',
    aliases: ['xiangmu', 'bailamu', 'hongxiang'],
    name: '白橡木皮',
    englishName: 'White Oak Veneer',
    category: '天然',
    texture: '直纹',
    color: '浅木色',
    colorGroup: '浅色',
    usage: '住宅 / 办公 / 墙板',
    thickness: '0.45mm',
    size: '2500x300mm',
    density: '0.66-0.74 g/cm3',
    hardness: 'Janka 1360 lbf',
    machinability: '切削性能优良，拼缝友好',
    stability: '高，色调稳定',
    processSuggestion: [
      '建议同批次排版，保证浅色空间统一性。',
      '可采用亚光封闭漆突出木纹层次。',
      '大面积墙板先预拼后上墙，降低拼缝误差。',
    ],
    maintenance: [
      '避免高色素液体长时间接触。',
      '每 6-12 个月进行表面养护。',
      '使用软布顺纹理清洁，减少细划痕。',
    ],
    certification: ['FSC 可持续林业认证', '低 VOC 表面处理工艺兼容'],
    priceRange: '¥95 - ¥150 / 张',
    intro: '色调干净稳定，适合现代与北欧风格空间。',
    subtitle: '欧洲直纹木皮',
    image: '/images/wood-white-oak.svg',
    detailImages: [
      '/images/wood-white-oak.svg',
      '/images/case-wall.svg',
      '/images/hero-wood.svg',
    ],
    tags: ['浅色木皮', '办公空间', '墙板案例'],
    seoText:
      '白橡木皮在木皮购买与家具木皮销售中广泛应用，凭借浅木色与直纹优势，能有效提升空间明亮度与整体一致性。该木皮适用于住宅、办公和墙板系统，兼容多种施工工艺，便于批量项目落地。MUPI 提供白橡木皮的厚度、密度、硬度及价格区间说明，并配套施工案例与常见问题，帮助用户在预算、视觉风格和工期之间做出更高效的选材决策。',
  },
  {
    slug: 'teak',
    aliases: ['youmu', 'yingtaowu'],
    name: '柚木木皮',
    englishName: 'Teak Veneer',
    category: '天然',
    texture: '油润直纹',
    color: '金棕',
    colorGroup: '中性',
    usage: '酒店 / 会所 / 门板',
    thickness: '0.50mm',
    size: '2500x340mm',
    density: '0.62-0.68 g/cm3',
    hardness: 'Janka 1070 lbf',
    machinability: '油性良好，封边与打磨表现稳定',
    stability: '高，耐湿热表现好',
    processSuggestion: [
      '施工前建议检测基层含水率并统一调湿。',
      '推荐开放漆工艺，增强天然光泽层次。',
      '门板项目优先采用双层封边提高耐久性。',
    ],
    maintenance: [
      '避免高频硬物摩擦，定期做保护蜡养护。',
      '潮湿环境保持通风，减少表层返潮。',
      '建议每季度检查边位完整性。',
    ],
    certification: ['FSC 可持续来源可选', '绿色建材配套工艺兼容'],
    priceRange: '¥130 - ¥210 / 张',
    intro: '天然油性好，稳定性高，适配高端工装与门板项目。',
    subtitle: '东南亚精选木皮',
    image: '/images/wood-teak.svg',
    detailImages: [
      '/images/wood-teak.svg',
      '/images/case-hotel.svg',
      '/images/hero-wood.svg',
    ],
    tags: ['酒店工装', '门板', '稳定性高'],
    seoText:
      '柚木木皮以金棕色和油润纹理著称，是酒店工装、会所和高端门板项目常见的木皮类型。其稳定性和工艺适配性较高，适合对质感与耐用性要求并重的应用场景。MUPI 提供柚木木皮完整参数、应用案例和施工建议，支持快速报价与项目咨询。对于追求品牌空间质感和长期维护效率的客户，柚木木皮具备较强的综合表现。',
  },
  {
    slug: 'tech-veneer',
    aliases: ['keji-mupi', 'yanxun'],
    name: '科技木皮',
    englishName: 'Engineered Veneer',
    category: '科技',
    texture: '均匀线性纹理',
    color: '烟熏灰棕',
    colorGroup: '中性',
    usage: '批量工程 / 翻新',
    thickness: '0.45mm',
    size: '2500x300mm',
    density: '0.58-0.64 g/cm3',
    hardness: 'Janka 900 lbf',
    machinability: '高一致性，适配 CNC 与批量加工',
    stability: '高，批次色差可控',
    processSuggestion: [
      '适合标准化排版与批量下料。',
      '建议在同温湿环境完成整批贴合。',
      '可配合快固型胶水提升交付速度。',
    ],
    maintenance: [
      '日常清洁使用微湿软布即可。',
      '避免高温热源持续接触表面。',
      '建议重点维护高频接触边位。',
    ],
    certification: ['可持续材料利用率高', '低挥发性配套胶水兼容'],
    priceRange: '¥70 - ¥120 / 张',
    intro: '色差可控，批次稳定，适合工程化批量交付。',
    subtitle: '高一致性科技木皮',
    image: '/images/wood-black-walnut.svg',
    detailImages: [
      '/images/wood-black-walnut.svg',
      '/images/case-wall.svg',
      '/images/hero-wood.svg',
    ],
    tags: ['批量定制', '翻新', '高一致性'],
    seoText:
      '科技木皮是兼顾成本与一致性的热门选择，常用于大批量工程、商业翻新和统一视觉系统项目。通过可控纹理与稳定色差，科技木皮在木皮销售场景中具备较高交付效率。MUPI 提供科技木皮的参数、价格区间和施工建议，并可按项目需求匹配案例、工艺与报价方案，帮助用户更快完成采购决策。',
  },
  {
    slug: 'dyed-ash',
    aliases: ['dyed-ash'],
    name: '染色白蜡木皮',
    englishName: 'Dyed Ash Veneer',
    category: '染色',
    texture: '开放导管纹理',
    color: '定制色',
    colorGroup: '中性',
    usage: '商业空间 / 视觉统一',
    thickness: '0.45mm',
    size: '2500x300mm',
    density: '0.60-0.67 g/cm3',
    hardness: 'Janka 1200 lbf',
    machinability: '可定制色板，适配标准贴合流程',
    stability: '中高，需控制环境湿度',
    processSuggestion: [
      '项目启动前确认标准色板与容差范围。',
      '建议统一批次进行封闭处理，减少色偏。',
      '可配合品牌空间导视做整体色彩设计。',
    ],
    maintenance: [
      '避免酸碱性清洁剂直接接触表面。',
      '浅刮痕可采用同色护理剂修复。',
      '定期检查高曝光区域的色泽稳定性。',
    ],
    certification: ['可持续来源木材可选', '低 VOC 染色工艺可选'],
    priceRange: '¥110 - ¥170 / 张',
    intro: '支持色板定制，适合统一品牌空间视觉系统。',
    subtitle: '可定制色系木皮',
    image: '/images/wood-white-oak.svg',
    detailImages: [
      '/images/wood-white-oak.svg',
      '/images/case-office.svg',
      '/images/hero-wood.svg',
    ],
    tags: ['定制色', '品牌空间', '一致性'],
    seoText:
      '染色白蜡木皮适用于需要品牌色统一的商业空间与展示项目，兼具天然纹理与可定制色彩优势。该材料可在视觉识别、施工效率和项目成本之间取得平衡，适合中大型木皮应用场景。MUPI 提供染色木皮参数、工艺建议和报价支持，帮助用户快速匹配合适的木皮购买方案。',
  },
];
