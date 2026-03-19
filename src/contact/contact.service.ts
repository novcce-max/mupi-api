import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'node:fs';

import { ContactLog } from './entities/contact-log.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactLogDto } from './dto/update-contact-log.dto';

type ContactStorage = 'database' | 'file-fallback';

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
  constructor(
    @InjectRepository(ContactLog)
    private readonly contactLogRepository: Repository<ContactLog>,
  ) {}

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

  async getSummary(): Promise<ContactSummaryResult> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const total = await this.contactLogRepository.count();
    const today = await this.contactLogRepository
      .createQueryBuilder('log')
      .where('log.createdAt >= :todayStart', {
        todayStart: todayStart.toISOString(),
      })
      .getCount();
    const pending = await this.contactLogRepository.count({
      where: [
        { status: 'new' },
        { status: 'contacted' },
        { status: 'in_progress' },
      ],
    });
    const quoted = await this.contactLogRepository.count({
      where: { status: 'quoted' },
    });
    const won = await this.contactLogRepository.count({
      where: { status: 'won' },
    });
    const linkedLeads = await this.contactLogRepository
      .createQueryBuilder('log')
      .where(`COALESCE(log.visitorId, '') <> ''`)
      .getCount();
    const uniqueVisitorsRow = await this.contactLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.visitorId)', 'cnt')
      .where(`COALESCE(log.visitorId, '') <> ''`)
      .getRawOne<{ cnt: string }>();

    return {
      total,
      today,
      pending,
      quoted,
      won,
      linkedLeads,
      uniqueLeadVisitors: Number(uniqueVisitorsRow?.cnt ?? 0),
    };
  }

  async getFunnelPages(): Promise<ContactFunnelPageResult[]> {
    const rows = await this.contactLogRepository
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
      .addSelect(`SUM(CASE WHEN log.status = 'lost' THEN 1 ELSE 0 END)`, 'lost')
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
      // 4. 数据库失败时写入本地文件 /tmp/mupi_contact_logs.ndjson
      const fallbackRecord = {
        timestamp: new Date().toISOString(),
        fromPage,
        visitorId,
        sourceTag,
        name: dto.name,
        phone: dto.phone,
        email: dto.email ?? '',
        message: dto.message,
        website: dto.website ?? null,
        sourceIp: context.ip,
        userAgent: context.userAgent ?? null,
        error: (error as Error).message,
      };

      const line = `${JSON.stringify(fallbackRecord)}\n`;

      try {
        await fs.appendFile('/tmp/mupi_contact_logs.ndjson', line, 'utf8');
      } catch {
        throw new InternalServerErrorException('Failed to persist contact log');
      }

      return {
        logId: 0,
        storage: 'file-fallback',
      };
    }
  }
}
