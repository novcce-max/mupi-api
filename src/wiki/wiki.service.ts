import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { WikiSpecies } from './entities/wiki-species.entity';
import { CreateWikiDto } from './dto/create-wiki.dto';
import { CreateWikiSpeciesDto } from './dto/create-wiki-species.dto';
import { UpdateWikiSpeciesDto } from './dto/update-wiki-species.dto';

@Injectable()
export class WikiService {
  private readonly cachePrefix = 'wiki:list';

  constructor(
    @InjectRepository(WikiSpecies)
    private readonly wikiRepo: Repository<WikiSpecies>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(params: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<WikiSpecies[]> {
    const categoryKey = params.category ?? 'all';
    const cacheKey = await this.buildCacheKey(categoryKey);

    if (cacheKey) {
      try {
        const cached = await this.cache.get<WikiSpecies[]>(cacheKey);
        if (cached) {
          return cached;
        }
      } catch {
        // 缓存异常时直接退化为 DB 查询
      }
    }

    const qb = this.wikiRepo.createQueryBuilder('wiki');

    if (params.category) {
      qb.where('wiki.category = :category', { category: params.category });
    }

    qb.andWhere('wiki.status = :status', { status: 'published' });

    qb.orderBy('wiki.featured_on_home', 'DESC').addOrderBy(
      'wiki.created_at',
      'DESC',
    );

    const items = await qb.getMany();

    if (cacheKey) {
      try {
        await this.cache.set(cacheKey, items, 60);
      } catch {
        // 缓存失败不影响主流程
      }
    }

    return items;
  }

  async findOneBySlug(slug: string): Promise<WikiSpecies | null> {
    const entity = await this.wikiRepo.findOne({
      where: { slug, status: 'published' },
    });

    return entity ?? null;
  }

  async create(dto: CreateWikiDto): Promise<WikiSpecies> {
    try {
      const entity = this.wikiRepo.create({
        name: dto.name,
        englishName: dto.englishName ?? null,
        slug: dto.slug,
        category: dto.category,
        description: dto.description ?? null,
        photos: dto.photos ?? [],
        suitableScenes: dto.suitableScenes ?? [],
        priceRange: dto.priceRange ?? null,
        properties: dto.properties ?? {},
      });

      const saved = await this.wikiRepo.save(entity);
      await this.bumpCacheVersionSafely();
      return saved;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async update(id: string, dto: Partial<CreateWikiDto>): Promise<WikiSpecies> {
    const existing = await this.wikiRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Wiki species not found');
    }

    Object.assign(existing, {
      name: dto.name ?? existing.name,
      englishName:
        dto.englishName !== undefined ? dto.englishName : existing.englishName,
      slug: dto.slug ?? existing.slug,
      category: dto.category ?? existing.category,
      description:
        dto.description !== undefined ? dto.description : existing.description,
      photos: dto.photos ?? existing.photos,
      suitableScenes: dto.suitableScenes ?? existing.suitableScenes,
      priceRange:
        dto.priceRange !== undefined ? dto.priceRange : existing.priceRange,
      properties: dto.properties ?? existing.properties,
    });

    try {
      const saved = await this.wikiRepo.save(existing);
      await this.bumpCacheVersionSafely();
      return saved;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async countAll(): Promise<number> {
    return this.wikiRepo.count();
  }

  // ---------------- Admin methods ----------------

  async adminFindAll(): Promise<WikiSpecies[]> {
    return this.wikiRepo.find({
      order: { id: 'ASC' },
    });
  }

  async adminFindOne(id: string): Promise<WikiSpecies> {
    const entity = await this.wikiRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Wiki species not found');
    }
    return entity;
  }

  async adminCreate(dto: CreateWikiSpeciesDto): Promise<WikiSpecies> {
    const entity = this.wikiRepo.create({
      name: dto.name,
      englishName: dto.englishName ?? null,
      slug: dto.slug,
      category: dto.category,
      description: dto.description ?? null,
      photos: dto.photos ?? [],
      suitableScenes: dto.suitableScenes ?? [],
      priceRange: dto.priceRange ?? null,
      properties: dto.properties ?? {},
      status: dto.status ?? 'draft',
      tags: dto.tags ?? [],
      coverLayout: dto.coverLayout ?? 'single',
      publishMeta: dto.publishMeta ?? {},
    });
    const saved = await this.wikiRepo.save(entity);
    await this.bumpCacheVersionSafely();
    return saved;
  }

  async adminUpdate(
    id: string,
    dto: UpdateWikiSpeciesDto,
  ): Promise<WikiSpecies> {
    const existing = await this.adminFindOne(id);
    const next: WikiSpecies = {
      ...existing,
      name: dto.name ?? existing.name,
      englishName:
        dto.englishName !== undefined ? dto.englishName : existing.englishName,
      slug: dto.slug ?? existing.slug,
      category: dto.category ?? existing.category,
      description:
        dto.description !== undefined ? dto.description : existing.description,
      photos: dto.photos ?? existing.photos,
      suitableScenes: dto.suitableScenes ?? existing.suitableScenes,
      priceRange:
        dto.priceRange !== undefined ? dto.priceRange : existing.priceRange,
      properties: dto.properties ?? existing.properties,
      status: dto.status ?? existing.status,
      tags: dto.tags ?? existing.tags,
      coverLayout: dto.coverLayout ?? existing.coverLayout,
      publishMeta: dto.publishMeta ?? existing.publishMeta,
    };
    await this.wikiRepo.save(next);
    await this.bumpCacheVersionSafely();
    return next;
  }

  async adminRemove(id: string): Promise<void> {
    const existing = await this.wikiRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Wiki species not found');
    }
    await this.wikiRepo.delete(id);
    await this.bumpCacheVersionSafely();
  }

  /**
   * Seed: 从静态数据批量写入 wiki_species 表。
   * - 已存在 slug 的记录会被跳过，不抛错。
   */
  async seedFromArray(items: CreateWikiDto[]): Promise<{
    inserted: number;
    skipped: number;
    total: number;
  }> {
    if (!items || items.length === 0) {
      return {
        inserted: 0,
        skipped: 0,
        total: 0,
      };
    }

    const slugs = items.map((item) => item.slug);

    // 查出已存在的 slug，避免触发唯一索引错误
    const existing = await this.wikiRepo.find({
      where: { slug: In(slugs) },
      select: ['slug'],
    });
    const existingSlugs = new Set(existing.map((e) => e.slug));

    const toInsert = items.filter((item) => !existingSlugs.has(item.slug));
    const skipped = items.length - toInsert.length;

    if (toInsert.length === 0) {
      return {
        inserted: 0,
        skipped,
        total: items.length,
      };
    }

    const rows = toInsert.map((dto) =>
      this.wikiRepo.create({
        name: dto.name,
        englishName: dto.englishName ?? null,
        slug: dto.slug,
        category: dto.category,
        description: dto.description ?? null,
        photos: dto.photos ?? [],
        suitableScenes: dto.suitableScenes ?? [],
        priceRange: dto.priceRange ?? null,
        properties: dto.properties ?? {},
      }),
    );

    await this.wikiRepo.save(rows);
    await this.bumpCacheVersionSafely();

    return {
      inserted: rows.length,
      skipped,
      total: items.length,
    };
  }

  private async buildCacheKey(categoryKey: string): Promise<string | null> {
    try {
      const versionRaw = await this.cache.get<number>(`${this.cachePrefix}:v`);
      const version =
        typeof versionRaw === 'number' && Number.isFinite(versionRaw)
          ? versionRaw
          : 0;
      return `${this.cachePrefix}:${version}:${categoryKey}`;
    } catch {
      return null;
    }
  }

  private async bumpCacheVersionSafely(): Promise<void> {
    try {
      const key = `${this.cachePrefix}:v`;
      const current = await this.cache.get<number>(key);
      const next =
        typeof current === 'number' && Number.isFinite(current)
          ? current + 1
          : 1;
      await this.cache.set(key, next, 3600);
    } catch {
      // 缓存版本更新失败时忽略，不阻塞写入
    }
  }
}
