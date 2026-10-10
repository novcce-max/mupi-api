export type ProblemCategory =
  | '施工异常'
  | '材料与选型'
  | '成本与报价'
  | '施工指南';

export type ProblemFAQ = {
  q: string;
  a: string;
};

export type ProblemSymptom = {
  title: string;
  frequency: '高' | '中' | '低';
  scene: string;
};

export type ProblemDetail = {
  slug: string;
  category: ProblemCategory;
  title: string;
  summary: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  symptoms: ProblemSymptom[];
  reasons: string[];
  steps: string[];
  tools: string[];
  materials: string[];
  preventions: string[];
  faq: ProblemFAQ[];
  recommendedMaterialSlugs: string[];
  status?: string;
  tags?: string[];
  coverLayout?: 'single' | 'triple' | string;
  publishMeta?: Record<string, unknown>;
};

export const PROBLEM_DETAILS: Record<string, ProblemDetail> = {
  qipao: {
    slug: 'qipao',
    category: '施工异常',
    title: '木皮起泡怎么处理',
    summary: '木皮起泡通常与基层含水率、胶水工艺窗口和压合不足有关。',
    heroTitle: '木皮起泡怎么办？完整解决方案解析',
    heroSubtitle: '基于实际施工经验，提供可执行的排查与修复步骤。',
    heroImage: '/images/case-wall.svg',
    symptoms: [
      {
        title: '板面局部鼓包，按压有空鼓感',
        frequency: '高',
        scene: '墙板 / 柜门',
      },
      { title: '边位平整但中部起鼓', frequency: '中', scene: '大板贴皮' },
      { title: '交付后一周内陆续冒泡', frequency: '中', scene: '潮湿环境' },
    ],
    reasons: [
      '基层潮湿或平整度不足',
      '胶水配比或开放时间控制不当',
      '边角与中部压合压力不均',
    ],
    steps: [
      '定位起泡区域并排查基层',
      '局部补胶后二次压实',
      '必要时更换局部木皮并重新收边',
    ],
    tools: ['含水率测试仪', '压辊 / 压板', '注胶针筒', '热风枪（低温）'],
    materials: ['匹配胶水', '同批次木皮补片', '收边辅材'],
    preventions: [
      '施工前检测基层含水率',
      '按工艺参数控制胶水与压合时间',
      '关键区域执行二次压实',
    ],
    faq: [
      {
        q: '起泡一定要整板返工吗？',
        a: '不一定。小范围空鼓可局部补胶和压实，超过可视阈值再考虑分区返工。',
      },
      {
        q: '夏季是否更容易起泡？',
        a: '是，温湿波动大时更容易出现，建议加强含水率验收和通风管理。',
      },
    ],
    recommendedMaterialSlugs: ['white-oak', 'tech-veneer'],
  },
  tuojiao: {
    slug: 'tuojiao',
    category: '施工异常',
    title: '木皮脱胶怎么处理',
    summary: '脱胶常见于胶水失效、表面处理不当或施工环境波动过大。',
    heroTitle: '木皮脱胶怎么修复？现场处理流程',
    heroSubtitle: '先判断胶层失效原因，再做分区修复，避免重复返工。',
    heroImage: '/images/case-office.svg',
    symptoms: [
      {
        title: '边角开口，轻拉可分离',
        frequency: '高',
        scene: '门套 / 柜体边位',
      },
      { title: '接缝处可见胶层粉化', frequency: '中', scene: '翻新项目' },
      { title: '同区域反复脱胶', frequency: '低', scene: '基层不稳' },
    ],
    reasons: ['胶水型号不匹配', '基层粉化或有油污', '施工温湿度波动大'],
    steps: ['清理失效胶层', '修复基层后重新上胶', '按标准压力和时间压合并复检'],
    tools: ['刮刀', '砂纸', '压边器', '清洁棉布'],
    materials: ['匹配木皮胶', '封闭底涂', '封边条'],
    preventions: [
      '优先使用匹配木皮类型的胶水',
      '施工前完成基层清洁与封闭处理',
      '现场恒温恒湿管理',
    ],
    faq: [
      {
        q: '直接补胶会不会再次开边？',
        a: '若基层未修复，确实可能复发。建议先处理基层，再补胶压实。',
      },
      {
        q: '如何判断胶水是否匹配？',
        a: '先做小样附着力测试，观察24小时后的剥离情况再批量施工。',
      },
    ],
    recommendedMaterialSlugs: ['black-walnut', 'dyed-ash'],
  },
  kailie: {
    slug: 'kailie',
    category: '施工异常',
    title: '木皮开裂怎么处理',
    summary: '开裂多由含水率不平衡、基层应力和环境变化引发。',
    heroTitle: '木皮开裂如何处理？先查原因再修复',
    heroSubtitle: '通过裂缝等级判断处理方式，避免扩大返工范围。',
    heroImage: '/images/case-wall.svg',
    symptoms: [
      { title: '顺纹细裂，触感轻微起毛', frequency: '中', scene: '干燥季节' },
      { title: '边位纵向裂缝明显', frequency: '高', scene: '门板 / 收口位' },
      { title: '拼缝周边开裂', frequency: '中', scene: '大面积拼板' },
    ],
    reasons: [
      '木皮含水率与环境不匹配',
      '基层热胀冷缩应力释放',
      '边位收口工艺不足',
    ],
    steps: [
      '评估裂缝范围',
      '小裂缝局部修补并封闭',
      '大面积开裂建议局部更换木皮',
    ],
    tools: ['含水率测试仪', '补缝刀', '压边器', '细砂纸'],
    materials: ['修补腻子', '同纹理木皮补片', '保护清漆'],
    preventions: [
      '进场材料静置平衡含水率',
      '边位采用加强收口工艺',
      '避免长期暴晒和高湿环境',
    ],
    faq: [
      {
        q: '细裂需要马上处理吗？',
        a: '建议尽快封闭，避免裂缝扩大影响外观和结构稳定。',
      },
      {
        q: '开裂与木皮品类有关吗？',
        a: '与品类有关，但更关键是基层状态、含水率和收口工艺。',
      },
    ],
    recommendedMaterialSlugs: ['white-oak', 'teak'],
  },
  qiabian: {
    slug: 'qiabian',
    category: '施工异常',
    title: '木皮翘边怎么处理',
    summary: '翘边是木皮边缘失去附着力的典型问题，需优先处理边位。',
    heroTitle: '木皮翘边处理指南：边位修复与防复发',
    heroSubtitle: '聚焦边位工艺与压实方法，提升长期稳定性。',
    heroImage: '/images/case-office.svg',
    symptoms: [
      { title: '边位翘起 1-3mm', frequency: '高', scene: '高频开合区域' },
      { title: '收口位出现毛边', frequency: '中', scene: '异形收边' },
      { title: '边位二次翘起', frequency: '低', scene: '湿度波动区域' },
    ],
    reasons: ['边位压实不足', '收边工艺不完整', '长期湿度波动'],
    steps: ['清理边位并补胶', '使用压边工具二次压合', '边位加防护封闭处理'],
    tools: ['压边滚轮', '切边刀', '热风枪（低温）'],
    materials: ['耐磨封边条', '边位专用胶', '封闭保护剂'],
    preventions: [
      '施工时增加边位压实次数',
      '边位使用耐磨封边条',
      '避免湿气长期侵入',
    ],
    faq: [
      {
        q: '翘边可以直接打钉固定吗？',
        a: '不建议，容易留下可视痕迹。应优先用补胶和压边工艺修复。',
      },
      {
        q: '边位返工后多久复检？',
        a: '建议24小时和7天各复检一次，确保稳定。',
      },
    ],
    recommendedMaterialSlugs: ['teak', 'tech-veneer'],
  },
  bianxing: {
    slug: 'bianxing',
    category: '施工异常',
    title: '木皮变形怎么处理',
    summary: '变形通常由环境湿度变化与基材稳定性不足叠加造成。',
    heroTitle: '木皮变形处理方案：排查、压平、分区返工',
    heroSubtitle: '通过环境控制与结构修复，降低反复变形风险。',
    heroImage: '/images/case-hotel.svg',
    symptoms: [
      { title: '板面轻微弯曲', frequency: '中', scene: '潮湿区域' },
      { title: '门板变形影响开合', frequency: '高', scene: '门扇项目' },
      { title: '局部鼓起并伴随开缝', frequency: '中', scene: '大板拼接' },
    ],
    reasons: ['基材受潮膨胀', '施工时含水率控制不足', '单侧受力导致应力失衡'],
    steps: [
      '检测变形来源并控制环境',
      '轻微变形可调整固定与压平',
      '严重变形建议分区返工',
    ],
    tools: ['温湿度计', '含水率测试仪', '压平夹具'],
    materials: ['防潮底涂', '稳定型胶水', '平衡层辅材'],
    preventions: ['选用稳定基材', '执行含水率验收流程', '完善背面平衡处理工艺'],
    faq: [
      {
        q: '变形能否只修表面？',
        a: '通常不够，需要同时处理环境与基材应力来源。',
      },
      {
        q: '工装项目如何预防变形？',
        a: '提前做环境评估、分区施工和交付前稳定性复检。',
      },
    ],
    recommendedMaterialSlugs: ['teak', 'tech-veneer'],
  },
  secha: {
    slug: 'secha',
    category: '材料与选型',
    title: '木皮色差怎么控制',
    summary: '色差控制依赖批次管理、预拼编号和样板确认。',
    heroTitle: '木皮色差控制方法：批次、排版、样板三步',
    heroSubtitle: '从选材到施工全流程控制色差，提升最终一致性。',
    heroImage: '/images/case-wall.svg',
    symptoms: [
      { title: '同立面颜色深浅不一', frequency: '高', scene: '墙板项目' },
      { title: '拼缝处色温突变', frequency: '中', scene: '门墙柜一体' },
      { title: '交付后局部发黄', frequency: '低', scene: '高日照区域' },
    ],
    reasons: ['材料批次混用', '施工顺序未按编号', '后处理工艺不一致'],
    steps: ['按区域复核色板', '分区拆解并统一重排', '重新执行后处理一致化工艺'],
    tools: ['标准色板', '编号标签', '照度计'],
    materials: ['同批次木皮', '统一面漆体系', '色差记录表'],
    preventions: ['同批次供料', '施工前预拼编号', '样板先行并固化验收标准'],
    faq: [
      {
        q: '天然木皮能做到完全无色差吗？',
        a: '不能完全消除，但可通过批次管理和排版将色差控制在可接受范围。',
      },
      {
        q: '为什么打样和现场有差异？',
        a: '常见原因是光照条件和面漆体系不同，建议样板与现场同工艺验证。',
      },
    ],
    recommendedMaterialSlugs: ['white-oak', 'dyed-ash'],
  },
  'jiaoshui-cuo': {
    slug: 'jiaoshui-cuo',
    category: '施工异常',
    title: '胶水选错如何处理',
    summary: '胶水失配会导致附着力不足、起泡或后期开边。',
    heroTitle: '胶水选错怎么办？失配排查与返工建议',
    heroSubtitle: '先停工抽检，再做局部返工，避免问题扩大。',
    heroImage: '/images/case-office.svg',
    symptoms: [
      { title: '附着力明显下降', frequency: '高', scene: '大面积贴皮' },
      { title: '边位频繁开边', frequency: '中', scene: '门板 / 护墙' },
      { title: '胶层发白或粉化', frequency: '低', scene: '低温施工' },
    ],
    reasons: ['胶水型号与木皮不匹配', '配比误差', '环境不符合施工要求'],
    steps: [
      '停止继续施工',
      '抽检附着力并定位问题区域',
      '更换匹配胶水后分区返工',
    ],
    tools: ['附着力测试刀', '称量工具', '温湿度计'],
    materials: ['匹配胶水', '基层封闭底涂', '返工保护膜'],
    preventions: ['施工前做小样验证', '建立胶水参数卡', '现场培训工艺执行要点'],
    faq: [
      {
        q: '是否需要全量返工？',
        a: '视抽检结果决定。若问题集中在局部，可优先分区返工。',
      },
      {
        q: '如何降低再次失配风险？',
        a: '建立材料-胶水匹配清单，并将小样验证作为必经环节。',
      },
    ],
    recommendedMaterialSlugs: ['black-walnut', 'tech-veneer'],
  },
  'baojia-xian': {
    slug: 'baojia-xian',
    category: '成本与报价',
    title: '报价陷阱如何规避',
    summary: '低价报价常隐藏损耗、辅材或工艺成本，后期易加价。',
    heroTitle: '木皮报价避坑：如何看懂真实成本结构',
    heroSubtitle: '拆分主材、辅材、工艺和交付条款，减少后期争议。',
    heroImage: '/images/case-hotel.svg',
    symptoms: [
      { title: '报价总价低但缺少明细', frequency: '高', scene: '初次采购' },
      { title: '中途频繁增加费用', frequency: '中', scene: '工程项目' },
      { title: '验收标准口径不一致', frequency: '中', scene: '跨团队协作' },
    ],
    reasons: ['报价结构不透明', '未拆分主材/辅材/工艺', '未约定验收标准'],
    steps: ['要求明细报价单', '补充损耗与工艺条款', '对比至少2-3家同口径报价'],
    tools: ['报价对比表', '损耗核算模板', '合同条款清单'],
    materials: ['主材清单', '辅材清单', '验收标准文档'],
    preventions: ['固定报价模板', '验收标准写入合同', '关键节点保留记录'],
    faq: [
      {
        q: '为什么同材质报价差距大？',
        a: '常见差异在损耗口径、辅材等级、施工工序和交付责任划分。',
      },
      {
        q: '如何快速判断报价是否完整？',
        a: '先看是否拆分主材、辅材、工艺、运输、售后与验收条款。',
      },
    ],
    recommendedMaterialSlugs: ['tech-veneer', 'white-oak'],
  },
  'tiepi-zhuyishixiang': {
    slug: 'tiepi-zhuyishixiang',
    category: '施工指南',
    title: '贴木皮注意事项清单',
    summary: '开工前把基层、环境、材料和验收口径一次性确认，可显著降低返工率。',
    heroTitle: '贴木皮注意事项：开工前必须确认的 10 件事',
    heroSubtitle: '从基层验收到收口复检，用一套可执行清单避免常见施工风险。',
    heroImage: '/images/case-office.svg',
    symptoms: [
      {
        title: '材料到场后直接施工，未做平衡静置',
        frequency: '高',
        scene: '赶工项目',
      },
      {
        title: '基层平整度与含水率未检测',
        frequency: '高',
        scene: '现场改造',
      },
      {
        title: '验收口径未提前统一',
        frequency: '中',
        scene: '多方协同项目',
      },
    ],
    reasons: ['施工前检查不完整', '工艺参数未固化', '样板与现场条件不一致'],
    steps: [
      '先做基层与环境验收',
      '确认木皮批次、排版与胶水参数',
      '按节点复检并留存施工记录',
    ],
    tools: ['含水率测试仪', '2m靠尺', '温湿度计', '样板确认单'],
    materials: ['同批次木皮', '匹配胶水', '封边辅材', '验收记录模板'],
    preventions: [
      '施工前静置平衡木皮',
      '先做小样再批量施工',
      '把验收标准写入合同附件',
    ],
    faq: [
      {
        q: '注意事项需要每个项目都完整执行吗？',
        a: '建议执行。即使是小项目，也应至少完成基层、环境和材料三项核心检查。',
      },
      {
        q: '赶工期是否可以省略静置环节？',
        a: '不建议。省略静置是后期开裂、翘边和色差放大的高风险源头。',
      },
    ],
    recommendedMaterialSlugs: ['white-oak', 'tech-veneer'],
  },
  'tiepi-jiqiao': {
    slug: 'tiepi-jiqiao',
    category: '施工指南',
    title: '贴木皮技巧实操',
    summary: '通过排版、压合、收口和复检四个技巧，提高成品一致性和稳定性。',
    heroTitle: '贴木皮技巧：减少返工的 6 个关键动作',
    heroSubtitle: '聚焦现场可执行动作，让拼缝更顺、边位更稳、整体更耐看。',
    heroImage: '/images/case-wall.svg',
    symptoms: [
      { title: '拼缝不顺，视觉断层明显', frequency: '中', scene: '大面积墙板' },
      { title: '边角收口毛糙，触感不平', frequency: '高', scene: '柜门/门套' },
      {
        title: '局部压合不足导致后期开边',
        frequency: '中',
        scene: '异形位施工',
      },
    ],
    reasons: [
      '排版顺序不合理',
      '压合节奏与压力控制不足',
      '边位工艺细节执行不到位',
    ],
    steps: [
      '先编号预拼并确定纹理走向',
      '按分区压合，边位做二次压实',
      '收口后执行 24h 与 7 天复检',
    ],
    tools: ['压边滚轮', '修边刀', '定位标记贴', '照度灯'],
    materials: ['边位专用胶', '耐磨封边条', '同纹理补片'],
    preventions: [
      '大面先排版后施工',
      '节点拍照留档便于追溯',
      '关键位采用双人复核制度',
    ],
    faq: [
      {
        q: '技巧和标准工艺有什么区别？',
        a: '标准工艺是底线，技巧是提升项，重点解决视觉一致性与长期稳定性。',
      },
      {
        q: '最容易被忽略的技巧是什么？',
        a: '边位二次压实和复检记录，往往决定后期是否开边。',
      },
    ],
    recommendedMaterialSlugs: ['black-walnut', 'teak'],
  },
  'tiepi-changjian-guzhang': {
    slug: 'tiepi-changjian-guzhang',
    category: '施工异常',
    title: '故障排查',
    summary: '围绕起泡、脱胶、开裂、翘边等高频故障，给出快速定位与处理流程。',
    heroTitle: '故障排查：现场快速定位与处理流程',
    heroSubtitle: '按“症状-原因-动作”快速定位问题，优先控制损失再做修复。',
    heroImage: '/images/case-hotel.svg',
    symptoms: [
      { title: '局部空鼓并伴随轻微起皱', frequency: '高', scene: '柜体/墙板' },
      {
        title: '边位反复开边，复发频率高',
        frequency: '中',
        scene: '高频开合区域',
      },
      { title: '拼缝处开裂并延伸', frequency: '中', scene: '大板拼贴' },
    ],
    reasons: [
      '基层、胶水、环境三项参数不匹配',
      '局部先处理未做系统排查',
      '交付前复检深度不足',
    ],
    steps: [
      '先划分故障等级与范围',
      '执行分区修复并验证附着力',
      '完成节点复检后再交付',
    ],
    tools: ['附着力测试刀', '温湿度计', '含水率测试仪', '修边工具'],
    materials: ['匹配胶水', '封闭底涂', '同批次补片', '保护涂层'],
    preventions: [
      '建立故障分级处理 SOP',
      '关键参数形成现场卡片',
      '交付前执行二次验收',
    ],
    faq: [
      {
        q: '故障排查先看哪一项？',
        a: '先看范围和扩散速度，再看基层和胶层状态，最后排查环境波动。',
      },
      {
        q: '同区域反复故障该怎么处理？',
        a: '应提升为系统问题处理，通常需要同时调整基层、胶水与施工节奏。',
      },
    ],
    recommendedMaterialSlugs: ['tech-veneer', 'white-oak'],
  },
  'tiepi-fanche-yuanyin': {
    slug: 'tiepi-fanche-yuanyin',
    category: '成本与报价',
    title: '贴木皮翻车原因复盘',
    summary: '翻车通常不是单点失误，而是选材、报价、工艺和验收四环节叠加失控。',
    heroTitle: '贴木皮翻车原因：从失败案例反推正确流程',
    heroSubtitle: '用真实复盘框架识别风险源，提前锁定材料、工艺和交付边界。',
    heroImage: '/images/case-office.svg',
    symptoms: [
      {
        title: '前期低价中标，后期频繁追加',
        frequency: '高',
        scene: '成本压缩项目',
      },
      {
        title: '样板效果与大货差异明显',
        frequency: '中',
        scene: '跨批次采购',
      },
      {
        title: '验收争议集中在边位与拼缝',
        frequency: '中',
        scene: '多工种交叉现场',
      },
    ],
    reasons: [
      '前期决策只看单价忽视总成本',
      '样板、批次、施工条件未统一',
      '验收标准和责任边界不清晰',
    ],
    steps: [
      '按主材/辅材/工艺拆解成本',
      '建立样板-批次-现场一致性流程',
      '在合同中明确验收标准与责任边界',
    ],
    tools: ['报价拆分模板', '风险清单', '样板签样单', '验收记录表'],
    materials: ['主材与辅材明细', '节点验收标准', '项目复盘模板'],
    preventions: [
      '优先看全生命周期成本',
      '跨团队开工前统一标准',
      '关键节点保留证据链',
    ],
    faq: [
      {
        q: '翻车主要是施工问题吗？',
        a: '不完全是。选材、报价口径和验收机制同样是高频翻车源头。',
      },
      {
        q: '怎么降低翻车概率？',
        a: '把风险前置：先做样板、锁定批次、固化参数、节点复检和书面验收。',
      },
    ],
    recommendedMaterialSlugs: ['dyed-ash', 'black-walnut'],
  },
};

export const PROBLEMS: ProblemDetail[] = Object.values(PROBLEM_DETAILS);

export function getProblemBySlug(slug: string): ProblemDetail | undefined {
  return PROBLEM_DETAILS[slug];
}
