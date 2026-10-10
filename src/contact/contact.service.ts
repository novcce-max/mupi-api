import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { ContactLog } from './entities/contact-log.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactLogDto } from './dto/update-contact-log.dto';
import type {
  ContactFunnelQueryDto,
  ContactStatsRange,
} from './dto/contact-funnel-query.dto';

type ContactStorage = 'database';
const CHINA_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;
const IP_GEO_TIMEOUT_MS = 2500;

type IpGeoResolved = {
  regionLabel: string;
};

export interface ContactLogItem {
  id: string;
  fromPage: string;
  visitorId: string | null;
  sourceTag: string | null;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  assignee: string | null;
  notes: string | null;
  sourceIp: string | null;
  createdAt: string;
  followUpAt: string | null;
  updatedAt: string | null;
}

export interface ContactListResult {
  data: ContactLogItem[];
  total: number;
}

export interface ContactSummaryResult {
  total: number;
  today: number;
  pending: number;
  quoted: number;
  won: number;
  linkedLeads: number;
  uniqueLeadVisitors: number;
  regionDistribution: Array<{ region: string; count: number }>;
}

export interface ContactFunnelPageResult {
  path: string;
  leads: number;
  contacted: number;
  quoted: number;
  sampling: number;
  won: number;
  lost: number;
}

export interface ContactCreateResult {
  logId: number;
  storage: ContactStorage;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly ipGeoCache = new Map<
    string,
    { expiresAt: number; value: IpGeoResolved }
  >();

  constructor(
    @InjectRepository(ContactLog)
    private readonly contactLogRepository: Repository<ContactLog>,
  ) {}

  private sanitizeIp(raw: string | null | undefined): string {
    const ip = (raw ?? '').trim();
    if (!ip) return '';
    const first = ip.split(',')[0]?.trim() ?? '';
    if (!first) return '';
    if (first.startsWith('::ffff:')) return first.slice(7);
    return first;
  }

  private isPrivateOrLocalIp(ip: string): boolean {
    if (!ip) return true;
    if (ip === '::1' || ip === '127.0.0.1' || ip === '0.0.0.0') return true;
    if (
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.2') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.')
    ) {
      return true;
    }
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) {
      return true;
    }
    return false;
  }

  private normalizeMainlandRegion(rawRegion: string): string {
    const value = rawRegion.trim();
    if (!value) return '中国大陆';
    const regionMap: Record<string, string> = {
      Beijing: '北京市',
      Tianjin: '天津市',
      Shanghai: '上海市',
      Chongqing: '重庆市',
      Hebei: '河北省',
      Shanxi: '山西省',
      Liaoning: '辽宁省',
      Jilin: '吉林省',
      Heilongjiang: '黑龙江省',
      Jiangsu: '江苏省',
      Zhejiang: '浙江省',
      Anhui: '安徽省',
      Fujian: '福建省',
      Jiangxi: '江西省',
      Shandong: '山东省',
      Henan: '河南省',
      Hubei: '湖北省',
      Hunan: '湖南省',
      Guangdong: '广东省',
      Hainan: '海南省',
      Sichuan: '四川省',
      Guizhou: '贵州省',
      Yunnan: '云南省',
      Shaanxi: '陕西省',
      Gansu: '甘肃省',
      Qinghai: '青海省',
      Taiwan: '台湾',
      InnerMongolia: '内蒙古自治区',
      Guangxi: '广西壮族自治区',
      Tibet: '西藏自治区',
      Ningxia: '宁夏回族自治区',
      Xinjiang: '新疆维吾尔自治区',
      HongKong: '香港',
      Macau: '澳门',
    };
    if (regionMap[value]) return regionMap[value];
    return value;
  }

  private normalizeCountryLabel(
    rawCountryCode: string,
    rawCountry: string,
  ): string {
    const code = rawCountryCode.trim().toUpperCase();
    const country = rawCountry.trim();
    if (code === 'HK') return '香港';
    if (code === 'MO') return '澳门';
    if (code === 'TW') return '台湾';
    if (code === 'US') return '美国';
    if (!country) return code || '其他';
    return country;
  }

  private async fetchIpGeo(ip: string): Promise<IpGeoResolved> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IP_GEO_TIMEOUT_MS);
    try {
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!res.ok) return { regionLabel: '其他' };

      const body = (await res.json()) as {
        success?: boolean;
        country_code?: string;
        country?: string;
        region?: string;
      };
      if (body.success === false) return { regionLabel: '其他' };

      const countryCode = (body.country_code ?? '').trim().toUpperCase();
      const country = (body.country ?? '').trim();
      const region = (body.region ?? '').trim();

      if (countryCode === 'CN') {
        return { regionLabel: this.normalizeMainlandRegion(region) };
      }
      return { regionLabel: this.normalizeCountryLabel(countryCode, country) };
    } catch {
      return { regionLabel: '其他' };
    } finally {
      clearTimeout(timer);
    }
  }

  private async resolveGeoByIp(
    rawIp: string | null | undefined,
  ): Promise<IpGeoResolved> {
    const ip = this.sanitizeIp(rawIp);
    if (!ip) return { regionLabel: '未知' };
    if (this.isPrivateOrLocalIp(ip)) return { regionLabel: '内网/本机' };

    const now = Date.now();
    const cached = this.ipGeoCache.get(ip);
    if (cached && cached.expiresAt > now) return cached.value;

    const value = await this.fetchIpGeo(ip);
    this.ipGeoCache.set(ip, {
      value,
      expiresAt: now + 24 * 60 * 60 * 1000,
    });
    return value;
  }

  private getChinaDayStart(date: Date): Date {
    const shifted = new Date(date.getTime() + CHINA_TZ_OFFSET_MS);
    return new Date(
      Date.UTC(
        shifted.getUTCFullYear(),
        shifted.getUTCMonth(),
        shifted.getUTCDate(),
        -8,
        0,
        0,
        0,
      ),
    );
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private getRangeBounds(range: ContactStatsRange = 'all'): {
    start?: Date;
    end?: Date;
  } {
    const todayStart = this.getChinaDayStart(new Date());
    switch (range) {
      case 'today':
        return { start: todayStart, end: this.addDays(todayStart, 1) };
      case 'yesterday':
        return { start: this.addDays(todayStart, -1), end: todayStart };
      case '7d':
        return {
          start: this.addDays(todayStart, -6),
          end: this.addDays(todayStart, 1),
        };
      case '30d':
        return {
          start: this.addDays(todayStart, -29),
          end: this.addDays(todayStart, 1),
        };
      case 'all':
      default:
        return {};
    }
  }

  private applyStatsRange<T extends SelectQueryBuilder<ContactLog>>(
    qb: T,
    query?: ContactFunnelQueryDto,
  ): T {
    const { start, end } = this.getRangeBounds(query?.range ?? 'all');
    if (start) {
      qb.andWhere('log.createdAt >= :rangeStart', {
        rangeStart: start.toISOString(),
      });
    }
    if (end) {
      qb.andWhere('log.createdAt < :rangeEnd', {
        rangeEnd: end.toISOString(),
      });
    }
    return qb;
  }

  private inferSourceTag(fromPage: string, sourceTag?: string | null): string {
    const normalized = (sourceTag ?? '').trim().toLowerCase();
    if (normalized) return normalized;

    const value = fromPage.toLowerCase();
    if (value === '/' || value.startsWith('/?')) return 'homepage';
    if (value.startsWith('/mupi')) return 'material';
    if (value.startsWith('/wenti')) return 'problem';
    if (value.startsWith('/anli')) return 'case';
    if (value.startsWith('/baike')) return 'baike';
    if (value.startsWith('/fangan')) return 'service';
    if (value.startsWith('/contact')) return 'contact';
    if (value.startsWith('/admin')) return 'admin';
    return 'other';
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
  }): Promise<ContactListResult> {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
    const skip = (page - 1) * limit;
    const q = params?.q?.trim() ?? '';
    const status = params?.status?.trim() ?? 'all';

    const qb = this.contactLogRepository.createQueryBuilder('log');

    if (status && status !== 'all') {
      qb.andWhere('log.status = :status', { status });
    }

    if (q) {
      qb.andWhere(
        `(
          log.name ILIKE :kw
          OR log.phone ILIKE :kw
          OR log.email ILIKE :kw
          OR log.fromPage ILIKE :kw
          OR log.message ILIKE :kw
          OR COALESCE(log.assignee, '') ILIKE :kw
        )`,
        { kw: `%${q}%` },
      );
    }

    const [list, total] = await qb
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data: ContactLogItem[] = list.map((log) => ({
      id: String(log.id),
      fromPage: log.fromPage,
      visitorId: log.visitorId,
      sourceTag: log.sourceTag,
      name: log.name,
      phone: log.phone,
      email: log.email,
      message: log.message,
      status: log.status,
      assignee: log.assignee,
      notes: log.notes,
      sourceIp: log.sourceIp,
      createdAt: log.createdAt.toISOString(),
      followUpAt: log.followUpAt ? log.followUpAt.toISOString() : null,
      updatedAt: log.updatedAt ? log.updatedAt.toISOString() : null,
    }));

    return {
      data,
      total,
    };
  }

  async getSummary(
    query: ContactFunnelQueryDto = {},
  ): Promise<ContactSummaryResult> {
    const totalQb = this.applyStatsRange(
      this.contactLogRepository.createQueryBuilder('log'),
      query,
    );
    const total = await totalQb.getCount();
    const today = await this.applyStatsRange(
      this.contactLogRepository.createQueryBuilder('log').where('1 = 1'),
      { range: 'today' },
    ).getCount();
    const pending = await this.applyStatsRange(
      this.contactLogRepository
        .createQueryBuilder('log')
        .where(`log.status IN (:...pendingStatuses)`, {
          pendingStatuses: ['new', 'contacted', 'in_progress'],
        }),
      query,
    ).getCount();
    const quoted = await this.applyStatsRange(
      this.contactLogRepository
        .createQueryBuilder('log')
        .where('log.status = :status', { status: 'quoted' }),
      query,
    ).getCount();
    const won = await this.applyStatsRange(
      this.contactLogRepository
        .createQueryBuilder('log')
        .where('log.status = :status', { status: 'won' }),
      query,
    ).getCount();
    const linkedLeads = await this.applyStatsRange(
      this.contactLogRepository
        .createQueryBuilder('log')
        .where(`COALESCE(log.visitorId, '') <> ''`),
      query,
    ).getCount();
    const uniqueVisitorsRow = await this.applyStatsRange(
      this.contactLogRepository
        .createQueryBuilder('log')
        .select('COUNT(DISTINCT log.visitorId)', 'cnt')
        .where(`COALESCE(log.visitorId, '') <> ''`),
      query,
    ).getRawOne<{ cnt: string }>();
    const regionRows = await this.applyStatsRange(
      this.contactLogRepository
        .createQueryBuilder('log')
        .select('log.sourceIp', 'sourceIp'),
      query,
    ).getRawMany<{ sourceIp: string | null }>();

    const ips = Array.from(
      new Set(
        regionRows
          .map((row) => this.sanitizeIp(row.sourceIp))
          .filter((value) => value.length > 0),
      ),
    );
    const ipGeoPairs = await Promise.all(
      ips.map(async (ip) => ({ ip, geo: await this.resolveGeoByIp(ip) })),
    );
    const ipRegionMap = new Map<string, string>(
      ipGeoPairs.map((item) => [item.ip, item.geo.regionLabel]),
    );

    const regionCountMap = new Map<string, number>();
    for (const row of regionRows) {
      const ip = this.sanitizeIp(row.sourceIp);
      const region = ipRegionMap.get(ip) ?? '未知';
      regionCountMap.set(region, (regionCountMap.get(region) ?? 0) + 1);
    }

    const regionDistribution = Array.from(regionCountMap.entries())
      .map(([region, count]) => ({ region, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      total,
      today,
      pending,
      quoted,
      won,
      linkedLeads,
      uniqueLeadVisitors: Number(uniqueVisitorsRow?.cnt ?? 0),
      regionDistribution,
    };
  }

  async getFunnelPages(
    query: ContactFunnelQueryDto = {},
  ): Promise<ContactFunnelPageResult[]> {
    const rows = await this.applyStatsRange(
      this.contactLogRepository
        .createQueryBuilder('log')
        .select(`split_part(log.fromPage, '?', 1)`, 'path')
        .addSelect('COUNT(1)', 'leads')
        .addSelect(
          `SUM(CASE WHEN log.status IN ('contacted', 'in_progress') THEN 1 ELSE 0 END)`,
          'contacted',
        )
        .addSelect(
          `SUM(CASE WHEN log.status = 'quoted' THEN 1 ELSE 0 END)`,
          'quoted',
        )
        .addSelect(
          `SUM(CASE WHEN log.status = 'sampling' THEN 1 ELSE 0 END)`,
          'sampling',
        )
        .addSelect(`SUM(CASE WHEN log.status = 'won' THEN 1 ELSE 0 END)`, 'won')
        .addSelect(
          `SUM(CASE WHEN log.status = 'lost' THEN 1 ELSE 0 END)`,
          'lost',
        ),
      query,
    )
      .groupBy(`split_part(log.fromPage, '?', 1)`)
      .orderBy('leads', 'DESC')
      .getRawMany<{
        path: string;
        leads: string;
        contacted: string;
        quoted: string;
        sampling: string;
        won: string;
        lost: string;
      }>();

    return rows.map((row) => ({
      path: row.path || '/contact',
      leads: Number(row.leads ?? 0),
      contacted: Number(row.contacted ?? 0),
      quoted: Number(row.quoted ?? 0),
      sampling: Number(row.sampling ?? 0),
      won: Number(row.won ?? 0),
      lost: Number(row.lost ?? 0),
    }));
  }

  async updateLog(
    id: string,
    dto: UpdateContactLogDto,
  ): Promise<ContactLogItem> {
    const log = await this.contactLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException('Lead not found');
    }

    if (dto.status !== undefined) {
      log.status = dto.status;
    }
    if (dto.assignee !== undefined) {
      log.assignee = dto.assignee.trim() || null;
    }
    if (dto.notes !== undefined) {
      log.notes = dto.notes.trim() || null;
    }
    if (dto.followUpAt !== undefined) {
      log.followUpAt = dto.followUpAt ? new Date(dto.followUpAt) : null;
    }

    const saved = await this.contactLogRepository.save(log);

    return {
      id: String(saved.id),
      fromPage: saved.fromPage,
      visitorId: saved.visitorId,
      sourceTag: saved.sourceTag,
      name: saved.name,
      phone: saved.phone,
      email: saved.email,
      message: saved.message,
      status: saved.status,
      assignee: saved.assignee,
      notes: saved.notes,
      sourceIp: saved.sourceIp,
      createdAt: saved.createdAt.toISOString(),
      followUpAt: saved.followUpAt ? saved.followUpAt.toISOString() : null,
      updatedAt: saved.updatedAt ? saved.updatedAt.toISOString() : null,
    };
  }

  async exportCsv(): Promise<string> {
    const list = await this.contactLogRepository.find({
      order: { id: 'DESC' },
    });

    const header = [
      'ID',
      '来源页',
      '访客ID',
      '来源标签',
      '姓名',
      '电话',
      '邮箱',
      '留言',
      '状态',
      '负责人',
      '跟进时间',
      '备注',
      'IP',
      '提交时间',
    ];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

    const rows = list.map((log) =>
      [
        log.id,
        log.fromPage,
        log.visitorId ?? '',
        log.sourceTag ?? '',
        log.name,
        log.phone,
        log.email,
        log.message,
        log.status,
        log.assignee ?? '',
        log.followUpAt ? log.followUpAt.toISOString() : '',
        log.notes ?? '',
        log.sourceIp ?? '',
        log.createdAt.toISOString(),
      ]
        .map(escape)
        .join(','),
    );

    return [header.map(escape).join(','), ...rows].join('\n');
  }

  async create(
    dto: CreateContactDto,
    context: { ip: string; userAgent: string | null },
  ): Promise<ContactCreateResult> {
    // 1. honeypot 校验
    if (dto.website && dto.website.trim().length > 0) {
      throw new BadRequestException('Bot detected');
    }

    // 2. 提交过快校验
    if (dto.startedAt && Date.now() - dto.startedAt < 1500) {
      throw new BadRequestException('Submit too fast');
    }

    const fromPage = dto.fromPage ?? 'contact';
    const visitorId = dto.visitorId?.trim() || null;
    const sourceTag = this.inferSourceTag(fromPage, dto.sourceTag);

    // 3. 尝试写入数据库
    try {
      const log = this.contactLogRepository.create({
        fromPage,
        visitorId,
        sourceTag,
        name: dto.name,
        phone: dto.phone,
        // contact_logs.email is NOT NULL, but frontend allows empty email.
        email: dto.email ?? '',
        message: dto.message,
        status: 'new',
        assignee: null,
        notes: null,
        website: dto.website ?? null,
        sourceIp: context.ip,
        userAgent: context.userAgent ?? null,
        followUpAt: null,
      });

      const saved = await this.contactLogRepository.save(log);

      const logId = Number(saved.id);

      return {
        logId,
        storage: 'database',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`contact create failed: ${message}`);
      throw new InternalServerErrorException('Failed to persist contact log');
    }
  }
}
