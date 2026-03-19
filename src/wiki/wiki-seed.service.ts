import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WikiSpecies } from './entities/wiki-species.entity';
import { WIKI_SPECIES_DATA } from './wiki-data.constants';

// 从前端 ../../mupi/app/config/wiki-species.ts 硬编码复制的数据数组
const WIKI_SPECIES_SEED_DATA = [
  {
    slug: 'hutao',
    title: '胡桃木木皮百科',
    subtitle: '纹理层次、稳定性与高端场景适配说明',
    aliases: ['黑胡桃', 'walnut', 'black-walnut'],
    status: 'published',
    author: 'MUPI 内容组',
    reviewer: '技术顾问组',
    publishedAt: '2026-03-01',
    updatedAt: '2026-03-01',
    heroImage: '/images/wood-black-walnut.svg',
    heroAlt: '胡桃木木皮纹理示意',
    summary:
      '胡桃木木皮以深棕色层次和自然山纹见长，常用于高端家具、门墙柜和商业空间。决策时需优先关注批次一致性、拼缝策略和施工窗口。',
    sourceAndProcess: [
      '原木来源：主要以北美硬木体系为主，按项目要求做批次筛选。',
      '切片方式：常见平切与四分切，平切强调层次，四分切强调纹理稳定。',
      '干燥与分级：按含水率目标进行干燥，进入纹理、色差、节疤等分级流程。',
      '贴皮前处理：按项目做预拼编号与色板确认，再进入批量施工阶段。',
    ],
    properties: {
      chineseName: '胡桃木木皮',
      englishName: 'Walnut Veneer',
      colorTone: '深棕',
      grain: '山纹 / 直纹',
      density: '0.63-0.69 g/cm3',
      hardness: 'Janka 约 1010 lbf',
      stability: '中高（依赖批次与施工控制）',
      thickness: '0.45mm / 0.50mm',
      referencePrice: '¥120 - ¥180 / 张（参考）',
    },
    suitableScenes: [
      {
        scene: '高端家具',
        advice: '优先选层次清晰批次，柜门与侧板建议统一方向排版。',
        risk: '忽略批次差异会放大色差感知。',
      },
      {
        scene: '商务空间',
        advice: '建议先出样板墙，确认灯光下颜色表现再批量落地。',
        risk: '未做灯光条件验证会导致交付预期偏差。',
      },
    ],
    glueAndCraft: [
      '建议中高固含胶水体系，控制开放时间，避免深色木皮虚粘。',
      '边位和转角执行二次压实，减少后期开边与翘边。',
      '大面积立面建议“预拼编号 + 分区施工 + 节点复检”流程。',
    ],
    maintenance: [
      '使用中性清洁剂，避免强溶剂长期接触。',
      '长期日照区域建议增加抗 UV 表面保护。',
      '室内湿度建议保持在 45%-65%。',
    ],
    faq: [
      {
        q: '胡桃木为什么容易出现色差讨论？',
        a: '天然木皮本身存在纹理与色调离散，需通过批次管理和预拼策略控制。',
      },
      {
        q: '预算有限时还能用胡桃木风格吗？',
        a: '可采用“主视觉面天然胡桃木 + 次级面科技木皮”的组合策略。',
      },
    ],
    tags: ['深色', '高端', '家具', '商务空间'],
    relatedMaterialSlugs: ['black-walnut'],
    relatedCaseSlugs: ['jiaju-project-a', 'jiudian-project-d'],
    seoTitle: '胡桃木木皮百科｜纹理参数、施工建议与维护指南',
    seoDescription:
      '详细介绍胡桃木木皮的来源、纹理参数、应用场景、胶水施工与维护建议，帮助设计与采购团队完成选材决策。',
    seoKeywords: ['胡桃木百科', '胡桃木木皮', '胡桃木施工', '胡桃木维护'],
    references: [
      '项目批次资料与现场回访记录（内部）',
      '常用硬木材料参数资料（行业公开信息）',
    ],
  },
  {
    slug: 'baixiang',
    title: '白橡木木皮百科',
    subtitle: '浅色空间常用树种的选材与落地要点',
    aliases: ['白橡', 'white-oak'],
    status: 'published',
    author: 'MUPI 内容组',
    reviewer: '技术顾问组',
    publishedAt: '2026-03-01',
    updatedAt: '2026-03-01',
    heroImage: '/images/wood-white-oak.svg',
    heroAlt: '白橡木木皮纹理示意',
    summary:
      '白橡木木皮色调干净，适合现代、北欧和办公场景。核心在于同批次管理与大面积拼缝控制。',
    sourceAndProcess: [
      '原木筛选：按浅色一致性和纹理方向优先级分批筛选。',
      '切片方式：以直纹表现为主，提升空间整洁感。',
      '分级控制：重点控制节疤、色带与边部完整性。',
      '上墙前准备：先做样板确认，再执行分区编号施工。',
    ],
    properties: {
      chineseName: '白橡木木皮',
      englishName: 'White Oak Veneer',
      colorTone: '浅木色',
      grain: '直纹',
      density: '0.66-0.74 g/cm3',
      hardness: 'Janka 约 1360 lbf',
      stability: '高',
      thickness: '0.45mm',
      referencePrice: '¥95 - ¥150 / 张（参考）',
    },
    suitableScenes: [
      {
        scene: '住宅柜体',
        advice: '同空间建议统一批次，减少层高差异带来的视觉色偏。',
        risk: '多批次混用会增加“看起来不统一”的风险。',
      },
      {
        scene: '办公墙板',
        advice: '优先直纹排版，利于大面积连续视觉。',
        risk: '拼缝控制不足会削弱浅色高级感。',
      },
    ],
    glueAndCraft: [
      '浅色木皮施工前需确保基层洁净，防止透色污染。',
      '建议预拼后再固定方向施工，避免现场临时调整。',
      '收口建议与同色封边体系统一处理。',
    ],
    maintenance: [
      '避免高色素液体长期接触。',
      '定期软布顺纹理清洁。',
      '高频区域建议增加耐磨层。',
    ],
    faq: [
      {
        q: '白橡木皮适合大面积墙面吗？',
        a: '适合，但需先做排版和拼缝策略，保证整体连续感。',
      },
      {
        q: '浅色木皮为什么更看重基层？',
        a: '浅色更容易暴露基层污染与施工痕迹，前处理要求更高。',
      },
    ],
    tags: ['浅色', '办公', '住宅', '直纹'],
    relatedMaterialSlugs: ['white-oak'],
    relatedCaseSlugs: ['bangong-project-e', 'qiangban-project-c'],
    seoTitle: '白橡木木皮百科｜浅色木皮参数、场景与施工指南',
    seoDescription:
      '白橡木木皮详细百科：来源工艺、参数规格、场景适配、施工要点和维护建议，帮助你快速完成浅色木皮选型。',
    seoKeywords: ['白橡木百科', '白橡木皮', '浅色木皮', '白橡施工'],
    references: ['项目样板记录（内部）', '公开硬木参数资料（行业）'],
  },
  {
    slug: 'yumu',
    title: '榆木木皮百科',
    subtitle: '中性色自然纹理树种的应用与维护',
    aliases: ['榆木', 'elm'],
    status: 'published',
    author: 'MUPI 内容组',
    reviewer: '技术顾问组',
    publishedAt: '2026-03-01',
    updatedAt: '2026-03-01',
    heroImage: '/images/wood-teak.svg',
    heroAlt: '榆木木皮纹理示意',
    summary:
      '榆木木皮整体观感自然、亲和，适用于住宅与轻商业项目。落地关键是纹理方向一致和边位处理质量。',
    sourceAndProcess: [
      '原木处理：优先控制节疤比例和色带跳变。',
      '切片方式：以自然纹理表达为主，强调空间温润感。',
      '分级流程：重点关注拼接边完整性与纹理连贯。',
      '施工前准备：建议样板先行，确认色调和触感。',
    ],
    properties: {
      chineseName: '榆木木皮',
      englishName: 'Elm Veneer',
      colorTone: '中性色',
      grain: '自然纹理',
      density: '0.56-0.64 g/cm3',
      hardness: '中等',
      stability: '中高',
      thickness: '0.45mm',
      referencePrice: '¥90 - ¥140 / 张（参考）',
    },
    suitableScenes: [
      {
        scene: '住宅空间',
        advice: '与中性色墙地面搭配更稳，建议控纹理方向一致。',
        risk: '局部强反差搭配会削弱整体统一性。',
      },
      {
        scene: '轻商业',
        advice: '可通过局部深色点缀强化层次。',
        risk: '边位处理不到位会先暴露耐久问题。',
      },
    ],
    glueAndCraft: [
      '建议控制压合节奏，避免纹理拉扯变形。',
      '边角位建议增加封边加固工序。',
      '完工后建议留足稳定期再做最终交付验收。',
    ],
    maintenance: [
      '避免长期潮湿环境。',
      '定期检查边位与转角。',
      '建议按季度做轻维护。',
    ],
    faq: [
      {
        q: '榆木木皮适合做高频触达门板吗？',
        a: '可以，但建议配合耐磨表面处理和边位加固工艺。',
      },
      {
        q: '榆木与白橡如何选择？',
        a: '榆木更偏自然温润，白橡更偏清爽直纹，按风格和场景选择。',
      },
    ],
    tags: ['中性色', '住宅', '自然纹理'],
    relatedMaterialSlugs: ['teak'],
    relatedCaseSlugs: ['jiaju-project-g'],
    seoTitle: '榆木木皮百科｜参数、应用场景与施工维护建议',
    seoDescription:
      '榆木木皮百科内容：介绍榆木来源工艺、参数、应用场景、施工注意事项和维护建议，辅助项目快速落地。',
    seoKeywords: ['榆木百科', '榆木木皮', '榆木施工', '榆木维护'],
    references: ['项目现场复盘（内部）', '公开木材参数资料（行业）'],
  },
  {
    slug: 'youmu',
    title: '柚木木皮百科',
    subtitle: '高稳定性中性色木皮的工装应用',
    aliases: ['柚木', 'teak'],
    status: 'published',
    author: 'MUPI 内容组',
    reviewer: '技术顾问组',
    publishedAt: '2026-03-01',
    updatedAt: '2026-03-01',
    heroImage: '/images/wood-teak.svg',
    heroAlt: '柚木木皮纹理示意',
    summary: '柚木木皮油润感强且稳定，适合酒店、会所、门板等需要耐用性的项目。',
    sourceAndProcess: [
      '原木筛选：优先油润纹理和稳定性表现。',
      '切片方式：兼顾纹理自然感与批次一致性。',
      '干燥与分级：控制含水率并建立批次记录。',
      '施工前确认：建议结合样板和现场光照确认最终色感。',
    ],
    properties: {
      chineseName: '柚木木皮',
      englishName: 'Teak Veneer',
      colorTone: '金棕',
      grain: '油润直纹',
      density: '0.62-0.68 g/cm3',
      hardness: '中高',
      stability: '高',
      thickness: '0.50mm',
      referencePrice: '¥130 - ¥210 / 张（参考）',
    },
    suitableScenes: [
      {
        scene: '酒店工装',
        advice: '建议按区域分批交付并做节点验收。',
        risk: '工期压缩时容易忽略样板确认。',
      },
      {
        scene: '门板项目',
        advice: '边位收口需与耐磨策略联动。',
        risk: '忽略边位处理会先出现耐久问题。',
      },
    ],
    glueAndCraft: [
      '建议选择稳定窗口胶水体系并严格记录参数。',
      '同立面建议同批次施工，提升观感统一性。',
      '建议施工后做阶段性复检。',
    ],
    maintenance: [
      '保持通风与湿度稳定。',
      '高频区域定期检查表面耐磨层。',
      '局部损伤建议尽早修复，避免扩大。',
    ],
    faq: [
      {
        q: '柚木木皮为什么常用于工装？',
        a: '其稳定性和耐久表现更适合高频使用与连续交付场景。',
      },
      {
        q: '柚木价格区间为什么波动较大？',
        a: '受批次、规格、工艺和交付节奏影响，建议按项目清单确认参考报价。',
      },
    ],
    tags: ['工装', '中性色', '高稳定'],
    relatedMaterialSlugs: ['teak'],
    relatedCaseSlugs: ['jiudian-project-d'],
    seoTitle: '柚木木皮百科｜工装场景参数、施工与维护',
    seoDescription:
      '柚木木皮百科：覆盖来源工艺、参数特性、工装应用、施工建议和维护要点。',
    seoKeywords: ['柚木百科', '柚木木皮', '酒店工装木皮'],
    references: ['项目样板记录（内部）', '公开木材参数资料（行业）'],
  },
  {
    slug: 'yingtaomu',
    title: '樱桃木木皮百科（草稿）',
    subtitle: '草稿示例：后台发布后对外可见',
    aliases: ['cherry'],
    status: 'draft',
    author: 'MUPI 内容组',
    reviewer: '技术顾问组',
    publishedAt: '2026-03-01',
    updatedAt: '2026-03-01',
    heroImage: '/images/wood-white-oak.svg',
    heroAlt: '樱桃木木皮纹理示意',
    summary: '草稿内容示例。',
    sourceAndProcess: ['草稿内容'],
    properties: {
      chineseName: '樱桃木木皮',
      englishName: 'Cherry Veneer',
      colorTone: '暖色',
      grain: '细腻纹理',
      density: '待完善',
      hardness: '待完善',
      stability: '待完善',
      thickness: '待完善',
      referencePrice: '待完善',
    },
    suitableScenes: [{ scene: '待完善', advice: '待完善', risk: '待完善' }],
    glueAndCraft: ['待完善'],
    maintenance: ['待完善'],
    faq: [{ q: '待完善', a: '待完善' }],
    tags: ['草稿'],
    relatedMaterialSlugs: [],
    relatedCaseSlugs: [],
    seoTitle: '樱桃木木皮百科（草稿）',
    seoDescription: '草稿',
    seoKeywords: ['草稿'],
    references: ['草稿'],
  },
];

@Injectable()
export class WikiSeedService {
  constructor(
    @InjectRepository(WikiSpecies)
    private readonly repository: Repository<WikiSpecies>,
  ) {}

  /**
   * 使用硬编码的 WIKI_SPECIES_DATA 写入 wiki_species 表。
   * - 每条数据使用 repository.create + save
   * - 单条失败不影响整体循环，并打印出失败 slug
   * - 最终返回源数据长度
   */
  async runSeed(): Promise<{ count: number }> {
    console.log('当前硬编码数据量:', WIKI_SPECIES_DATA.length);

    for (const src of WIKI_SPECIES_DATA as any[]) {
      const entityData: Partial<WikiSpecies> = {
        slug: src.slug,
        name: src.properties.chineseName ?? src.title,
        englishName: src.properties.englishName ?? null,
        category: 'species',
        description: src.summary,
        photos: src.heroImage ? [src.heroImage] : [],
        suitableScenes: src.suitableScenes ?? [],
        priceRange: src.properties.referencePrice ?? null,
        properties: {
          ...src.properties,
          tags: src.tags,
          aliases: src.aliases,
          seoTitle: src.seoTitle,
          seoDescription: src.seoDescription,
          seoKeywords: src.seoKeywords,
          sourceAndProcess: src.sourceAndProcess,
          glueAndCraft: src.glueAndCraft,
          maintenance: src.maintenance,
          faq: src.faq,
          relatedMaterialSlugs: src.relatedMaterialSlugs,
          relatedCaseSlugs: src.relatedCaseSlugs,
          status: src.status,
          author: src.author,
          reviewer: src.reviewer,
          publishedAt: src.publishedAt,
          updatedAt: src.updatedAt,
        },
      };

      try {
        const entity = this.repository.create(entityData);
        await this.repository.save(entity);
      } catch (error) {
        // 单条失败时打印出 slug，方便排查

        console.error(
          '[WikiSeedService] Failed to seed slug:',
          src.slug,
          error,
        );
      }
    }

    return { count: WIKI_SPECIES_DATA.length };
  }
}
