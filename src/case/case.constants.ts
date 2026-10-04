export type CaseScene =
  | '家具贴皮'
  | '木门施工'
  | '墙板案例'
  | '酒店工装'
  | '办公空间'
  | '旧家具翻新'
  | '木纹膜'
  | string;

export type CaseBudget = '经济' | '中端' | '高端' | string;

export type CaseDifficulty = '低' | '中' | '高' | string;

export type RelatedProblemLink = {
  label: string;
  href: string;
};

export interface CaseItem {
  slug: string;
  title: string;
  scene: CaseScene;
  budget: CaseBudget;
  difficulty: CaseDifficulty;
  materialGrade: string;
  materialName: string;
  materialHref: string;
  area: string;
  timeline: string;
  challenge: string;
  solution: string;
  materials: string[];
  processImages: string[];
  relatedProblems: RelatedProblemLink[];
  beforeImages?: string[];
  afterImages?: string[];
  coverImage?: string | null;
  /** 案例详情页视频（上传后多为 /videos/... 或 CDN URL） */
  videoUrl?: string | null;
  tags?: string[];
  coverLayout?: 'single' | 'triple' | string;
  publishMeta?: Record<string, unknown>;
}

export const CASES: CaseItem[] = [
  {
    slug: 'jiaju-project-a',
    title: '家具贴皮项目 A',
    scene: '家具贴皮',
    budget: '中端',
    difficulty: '中',
    materialGrade: 'A 级',
    materialName: '黑胡桃木皮',
    materialHref: '/mupi/heihetao',
    area: '85 ㎡',
    timeline: '12 天',
    challenge: '转角位置易起边，板面纹理需要连续。',
    solution: '先做基层平整处理，统一纹理方向分区贴合，边角位二次压实。',
    materials: ['黑胡桃木皮', '贴皮胶水', '封边辅材'],
    processImages: ['基层处理', '贴合压实', '边角修整'],
    relatedProblems: [
      { label: '木皮起泡怎么处理', href: '/wenti/qipao' },
      { label: '木皮脱胶怎么处理', href: '/wenti/tuojiao' },
    ],
  },
  {
    slug: 'mumen-project-b',
    title: '木门施工项目 B',
    scene: '木门施工',
    budget: '中端',
    difficulty: '中',
    materialGrade: 'A 级',
    materialName: '樱桃木皮',
    materialHref: '/mupi/yingtaowu',
    area: '46 ㎡',
    timeline: '8 天',
    challenge: '门套与门扇颜色统一难，开合边位磨损风险高。',
    solution: '统一批次材料，边位增加耐磨处理并控制胶水用量。',
    materials: ['樱桃木皮', '环保胶水', '耐磨封边条'],
    processImages: ['门套基层处理', '门扇贴皮', '收边验收'],
    relatedProblems: [
      { label: '木皮开裂怎么处理', href: '/wenti/kailie' },
      { label: '木皮翘边怎么处理', href: '/wenti/qiabian' },
    ],
  },
  {
    slug: 'qiangban-project-c',
    title: '墙板案例项目 C',
    scene: '墙板案例',
    budget: '高端',
    difficulty: '高',
    materialGrade: 'A 级',
    materialName: '橡木木皮',
    materialHref: '/mupi/xiangmu',
    area: '160 ㎡',
    timeline: '18 天',
    challenge: '大面积墙板拼缝控制难，现场湿度波动大。',
    solution: '分区预拼编号，现场恒湿施工，拼缝位统一压缝处理。',
    materials: ['橡木木皮', '结构胶', '防潮底涂'],
    processImages: ['预拼编号', '分区上墙', '拼缝处理'],
    relatedProblems: [
      { label: '木皮变形怎么处理', href: '/wenti/bianxing' },
      { label: '木皮色差怎么控制', href: '/wenti/secha' },
    ],
  },
  {
    slug: 'jiudian-project-d',
    title: '酒店工装项目 D',
    scene: '酒店工装',
    budget: '高端',
    difficulty: '高',
    materialGrade: 'A 级',
    materialName: '胡桃木皮',
    materialHref: '/mupi/heihetao',
    area: '320 ㎡',
    timeline: '28 天',
    challenge: '工期紧且区域多，现场交叉施工干扰大。',
    solution: '按区域排产，关键节点提前打样确认，分批交付。',
    materials: ['胡桃木皮', '快固型胶水', '保护膜辅材'],
    processImages: ['样板确认', '分区施工', '成品保护'],
    relatedProblems: [
      { label: '胶水选错如何处理', href: '/wenti/jiaoshui-cuo' },
      { label: '报价陷阱如何规避', href: '/wenti/baojia-xian' },
    ],
  },
  {
    slug: 'bangong-project-e',
    title: '办公空间项目 E',
    scene: '办公空间',
    budget: '中端',
    difficulty: '中',
    materialGrade: 'B 级',
    materialName: '白橡木皮',
    materialHref: '/mupi/xiangmu',
    area: '210 ㎡',
    timeline: '20 天',
    challenge: '多区域颜色一致性要求高，现场切换工种频繁。',
    solution: '同批次供料，分区色板校验，工种交接前统一复检。',
    materials: ['白橡木皮', '贴皮胶水', '收边条'],
    processImages: ['色板校验', '分区施工', '交接复检'],
    relatedProblems: [
      { label: '木皮色差怎么处理', href: '/wenti/secha' },
      { label: '木皮起泡怎么处理', href: '/wenti/qipao' },
    ],
  },
  {
    slug: 'fanxin-project-f',
    title: '旧家具翻新项目 F',
    scene: '旧家具翻新',
    budget: '经济',
    difficulty: '中',
    materialGrade: 'B 级',
    materialName: '科技木皮',
    materialHref: '/mupi/keji-mupi',
    area: '32 ㎡',
    timeline: '6 天',
    challenge: '旧基层状态差，局部破损点多。',
    solution: '先修补基层再贴皮，重点部位加固压实，分段验收。',
    materials: ['科技木皮', '修补腻子', '胶水'],
    processImages: ['基层修补', '贴皮压实', '翻新验收'],
    relatedProblems: [
      { label: '假木皮如何鉴别', href: '/wenti/jiabianbie' },
      { label: '木皮脱胶怎么处理', href: '/wenti/tuojiao' },
    ],
  },
  {
    slug: 'jiaju-project-g',
    title: '家具贴皮项目 G',
    scene: '家具贴皮',
    budget: '中端',
    difficulty: '低',
    materialGrade: 'B 级',
    materialName: '白蜡木皮',
    materialHref: '/mupi/bailamu',
    area: '58 ㎡',
    timeline: '9 天',
    challenge: '柜体边位统一性要求高，局部收口复杂。',
    solution: '统一裁切模板，收口位置先预试拼再正式贴合。',
    materials: ['白蜡木皮', '环保胶水', '封边材料'],
    processImages: ['模板裁切', '预试拼', '正式贴合'],
    relatedProblems: [
      { label: '木皮开裂怎么处理', href: '/wenti/kailie' },
      { label: '木皮翘边怎么处理', href: '/wenti/qiabian' },
    ],
  },
  {
    slug: 'mumen-project-h',
    title: '木门施工项目 H',
    scene: '木门施工',
    budget: '中端',
    difficulty: '中',
    materialGrade: 'A 级',
    materialName: '柚木木皮',
    materialHref: '/mupi/youmu',
    area: '52 ㎡',
    timeline: '10 天',
    challenge: '门扇变形风险与边位耐久要求并存。',
    solution: '门扇含水率校验后施工，边位采用双层封边工艺。',
    materials: ['柚木木皮', '结构胶', '双层封边条'],
    processImages: ['含水率校验', '贴皮施工', '双层封边'],
    relatedProblems: [
      { label: '木皮变形怎么处理', href: '/wenti/bianxing' },
      { label: '木皮脱胶怎么处理', href: '/wenti/tuojiao' },
    ],
  },
  {
    slug: 'qiangban-project-i',
    title: '墙板案例项目 I',
    scene: '墙板案例',
    budget: '高端',
    difficulty: '高',
    materialGrade: 'A 级',
    materialName: '红橡木皮',
    materialHref: '/mupi/hongxiang',
    area: '240 ㎡',
    timeline: '24 天',
    challenge: '大跨度立面拼接精度要求高，工序衔接复杂。',
    solution: '深化排版图先行，现场按编号施工，工序交接节点复核。',
    materials: ['红橡木皮', '专用胶', '防潮基层板'],
    processImages: ['深化排版', '编号施工', '节点复核'],
    relatedProblems: [
      { label: '木皮色差怎么控制', href: '/wenti/secha' },
      { label: '胶水选错如何处理', href: '/wenti/jiaoshui-cuo' },
    ],
  },
  {
    slug: 'jiudian-project-j',
    title: '酒店工装项目 J',
    scene: '酒店工装',
    budget: '高端',
    difficulty: '高',
    materialGrade: 'A 级',
    materialName: '烟熏木皮',
    materialHref: '/mupi/yanxun',
    area: '410 ㎡',
    timeline: '35 天',
    challenge: '多批次材料进场，需控制色差与交付节奏。',
    solution: '分批次色板确认，按楼层分段施工，关键节点联合验收。',
    materials: ['烟熏木皮', '高性能胶水', '成品保护膜'],
    processImages: ['色板确认', '分段施工', '联合验收'],
    relatedProblems: [
      { label: '木皮起泡怎么处理', href: '/wenti/qipao' },
      { label: '报价陷阱如何规避', href: '/wenti/baojia-xian' },
    ],
  },
  {
    slug: 'muwen-project-k',
    title: '木纹膜柜体项目 K',
    scene: '木纹膜',
    budget: '中端',
    difficulty: '中',
    materialGrade: 'B 级',
    materialName: 'PVC 木纹膜',
    materialHref: '/mupi/keji-mupi',
    area: '68 ㎡',
    timeline: '11 天',
    challenge: '覆膜收口与批次纹理一致性要求高，异形边位易起翘。',
    solution: '先小面预贴试色，异形位模板裁切，热压与修边分段验收。',
    materials: ['木纹膜', '底涂', '修边胶'],
    processImages: ['试色预贴', '热压覆膜', '修边验收'],
    relatedProblems: [
      { label: '木皮翘边怎么处理', href: '/wenti/qiabian' },
      { label: '木皮色差怎么控制', href: '/wenti/secha' },
    ],
  },
];

export function getCaseBySlug(slug: string): CaseItem | undefined {
  return CASES.find((item) => item.slug === slug);
}
