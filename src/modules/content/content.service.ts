import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { ContentItem, type ContentStatus } from './content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

function slugify(input: string): string {
  const base = String(input || '')
    .trim()
    .toLowerCase();
  const normalized = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug;
}

function coerceStatus(input: unknown): ContentStatus {
  return input === 'published' ? 'published' : 'draft';
}

function asStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((x) => String(x || '').trim()).filter(Boolean);
}

function stripHtml(input: string): string {
  return (input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTextFromContent(content: unknown): string {
  if (!content) return '';
  try {
    if (typeof content === 'string') return stripHtml(content);
    if (Array.isArray(content)) {
      const parts: string[] = [];
      for (const block of content) {
        if (!block || typeof block !== 'object') continue;
        const b = block as Record<string, unknown>;
        if (typeof b.text === 'string') parts.push(b.text);
        if (Array.isArray(b.items)) {
          parts.push((b.items as unknown[]).join(' '));
        }
        if (Array.isArray(b.children)) {
          for (const c of b.children as unknown[]) {
            if (
              c &&
              typeof c === 'object' &&
              typeof (c as any).text === 'string'
            ) {
              parts.push(String((c as any).text));
            }
          }
        }
      }
      return stripHtml(parts.join(' '));
    }
    if (typeof content === 'object') {
      return stripHtml(JSON.stringify(content));
    }
  } catch {
    // ignore
  }
  return '';
}

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentItem)
    private readonly repo: Repository<ContentItem>,
  ) {}

  async list(params?: {
    q?: string;
    status?: ContentStatus | 'all';
  }): Promise<ContentItem[]> {
    const q = (params?.q || '').trim();
    const status = params?.status ?? 'published';
    const where: any = {};
    if (status !== 'all') where.status = status;
    if (q) {
      where.title = ILike(`%${q}%`);
    }
    return this.repo.find({
      where,
      order: { updatedAt: 'DESC' },
      take: 500,
    });
  }

  async findOne(id: number): Promise<ContentItem> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('内容不存在');
    return item;
  }

  private applySeoDefaults(next: {
    title: string;
    summary: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    content: unknown;
  }): { seoTitle: string | null; seoDescription: string | null } {
    const seoTitle = (next.seoTitle || '').trim() || next.title.trim();
    const desc =
      (next.seoDescription || '').trim() ||
      (next.summary || '').trim() ||
      extractTextFromContent(next.content).slice(0, 160);
    return {
      seoTitle: seoTitle || null,
      seoDescription: desc ? desc.slice(0, 800) : null,
    };
  }

  private async ensureUniqueSlug(
    desired: string,
    excludeId?: number,
  ): Promise<string> {
    const base = slugify(desired) || `content-${Date.now().toString(36)}`;
    let candidate = base.slice(0, 220);

    for (let i = 0; i < 10; i++) {
      const qb = this.repo
        .createQueryBuilder('c')
        .select(['c.id'])
        .where('c.slug = :slug', { slug: candidate });
      if (excludeId) {
        qb.andWhere('c.id <> :id', { id: excludeId });
      }
      const row = await qb.getOne();
      if (!row) return candidate;
      candidate = `${base}-${(i + 2).toString(36)}`.slice(0, 220);
    }

    return `${base}-${Date.now().toString(36)}`.slice(0, 220);
  }

  async create(dto: CreateContentDto): Promise<ContentItem> {
    const title = String(dto.title || '').trim();
    if (!title) throw new BadRequestException('标题不能为空');

    const content = dto.content ?? [];
    if (typeof content === 'string') {
      throw new BadRequestException('content 必须为 JSON 结构（非纯字符串）');
    }

    const slug = await this.ensureUniqueSlug(dto.slug || title);
    const summary = dto.summary ? String(dto.summary).slice(0, 800) : null;

    const seo = this.applySeoDefaults({
      title,
      summary,
      seoTitle: dto.seoTitle ? String(dto.seoTitle).slice(0, 220) : null,
      seoDescription: dto.seoDescription
        ? String(dto.seoDescription).slice(0, 800)
        : null,
      content,
    });

    const item = this.repo.create({
      title: title.slice(0, 200),
      slug,
      summary,
      content,
      coverImage: dto.coverImage ? String(dto.coverImage).slice(0, 500) : null,
      status: coerceStatus(dto.status),
      seoTitle: seo.seoTitle,
      seoDescription: seo.seoDescription,
      tags: asStringArray(dto.tags),
    });
    return this.repo.save(item);
  }

  async update(id: number, dto: UpdateContentDto): Promise<ContentItem> {
    const item = await this.findOne(id);

    const nextTitle =
      dto.title !== undefined ? String(dto.title || '').trim() : item.title;
    if (!nextTitle) throw new BadRequestException('标题不能为空');

    const nextContent = dto.content !== undefined ? dto.content : item.content;
    if (typeof nextContent === 'string') {
      throw new BadRequestException('content 必须为 JSON 结构（非纯字符串）');
    }

    const nextSummary =
      dto.summary !== undefined
        ? dto.summary
          ? String(dto.summary).slice(0, 800)
          : null
        : item.summary;

    const nextSlug =
      dto.slug !== undefined
        ? await this.ensureUniqueSlug(dto.slug || nextTitle, item.id)
        : item.slug;

    const seo = this.applySeoDefaults({
      title: nextTitle,
      summary: nextSummary,
      seoTitle:
        dto.seoTitle !== undefined
          ? dto.seoTitle
            ? String(dto.seoTitle).slice(0, 220)
            : null
          : item.seoTitle,
      seoDescription:
        dto.seoDescription !== undefined
          ? dto.seoDescription
            ? String(dto.seoDescription).slice(0, 800)
            : null
          : item.seoDescription,
      content: nextContent,
    });

    item.title = nextTitle.slice(0, 200);
    item.slug = nextSlug;
    item.summary = nextSummary;
    item.content = nextContent;
    item.coverImage =
      dto.coverImage !== undefined
        ? dto.coverImage
          ? String(dto.coverImage).slice(0, 500)
          : null
        : item.coverImage;
    if (dto.status !== undefined) {
      item.status = coerceStatus(dto.status);
    }
    item.seoTitle = seo.seoTitle;
    item.seoDescription = seo.seoDescription;
    if (dto.tags !== undefined) {
      item.tags = asStringArray(dto.tags);
    }

    return this.repo.save(item);
  }

  async remove(id: number): Promise<{ id: number }> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
    return { id };
  }
}
