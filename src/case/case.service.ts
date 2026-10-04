import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { Case } from './entities/case.entity';
import { CaseItem } from './case.constants';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';

export interface CaseResponse<T = unknown> {
  ok: boolean;
  data: T;
}

/** 长期稳定：保证返回结构完整，所有字段有安全默认值，避免前台 undefined 导致 .includes/.map 报错 */
function toCaseItem(entity: Case): CaseItem {
  const rawRelated = Array.isArray(entity.relatedProblems)
    ? entity.relatedProblems
    : [];
  const related = rawRelated.filter(
    (p): p is { label: string; href: string } =>
      p != null &&
      typeof (p as Record<string, unknown>).label === 'string' &&
      typeof (p as Record<string, unknown>).href === 'string',
  );
  return {
    slug: entity.slug ?? '',
    title: entity.title ?? '',
    scene: entity.scene ?? '',
    budget: entity.budget ?? '',
    difficulty: entity.difficulty ?? '',
    materialGrade: entity.materialGrade ?? '',
    materialName: entity.materialName ?? '',
    materialHref: entity.materialHref ?? '',
    area: entity.area ?? '',
    timeline: entity.timeline ?? '',
    challenge: entity.challenge ?? '',
    solution: entity.solution ?? '',
    materials: Array.isArray(entity.materials) ? entity.materials : [],
    processImages: Array.isArray(entity.processImages)
      ? entity.processImages
      : [],
    relatedProblems: related,
    beforeImages: Array.isArray(entity.beforeImages) ? entity.beforeImages : [],
    afterImages: Array.isArray(entity.afterImages) ? entity.afterImages : [],
    coverImage: entity.coverImage ?? null,
    videoUrl: entity.videoUrl ?? null,
    tags: Array.isArray(entity.tags) ? entity.tags : [],
    coverLayout: entity.coverLayout ?? 'single',
    publishMeta:
      entity.publishMeta && typeof entity.publishMeta === 'object'
        ? entity.publishMeta
        : {},
  };
}

@Injectable()
export class CaseService {
  private readonly cachePrefix = 'cases:list';

  constructor(
    @InjectRepository(Case)
    private readonly repository: Repository<Case>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(params?: {
    scene?: string;
    budget?: string;
    difficulty?: string;
    q?: string;
  }): Promise<CaseResponse<CaseItem[]>> {
    const { scene, budget, difficulty, q } = params || {};
    const keyword = (q || '').trim().toLowerCase();

    const sceneKey = scene && scene !== 'all' ? scene : 'all';
    const budgetKey = budget && budget !== 'all' ? budget : 'all';
    const difficultyKey =
      difficulty && difficulty !== 'all' ? difficulty : 'all';
    const searchKey = keyword || 'all';

    const cacheKey = await this.buildCacheKey(
      sceneKey,
      budgetKey,
      difficultyKey,
      searchKey,
    );

    if (cacheKey) {
      try {
        const cached = await this.cache.get<CaseItem[]>(cacheKey);
        if (cached) {
          return {
            ok: true,
            data: cached,
          };
        }
      } catch {
        // 缓存异常时退化为 DB 查询
      }
    }

    const qb = this.repository.createQueryBuilder('c');
    qb.where('c.published = :published', { published: true });

    if (scene && scene !== 'all') {
      qb.andWhere('c.scene = :scene', { scene });
    }

    if (budget && budget !== 'all') {
      qb.andWhere('c.budget = :budget', { budget });
    }

    if (difficulty && difficulty !== 'all') {
      qb.andWhere('c.difficulty = :difficulty', { difficulty });
    }

    if (keyword) {
      qb.andWhere("c.search_vector @@ plainto_tsquery('simple', :q)", {
        q: keyword,
      });
    }

    // 勿用 ::boolean 强转：publish_meta 里若为非 true/false 的字符串会导致 PG 报错整表 500
    qb.orderBy(
      "(CASE WHEN (c.publish_meta->>'featuredOnHome') IN ('true', 't', '1', 'True') THEN 1 ELSE 0 END)",
      'DESC',
    ).addOrderBy('c.createdAt', 'DESC');

    const list = await qb.getMany();
    const items = list.map(toCaseItem);

    if (cacheKey) {
      try {
        await this.cache.set(cacheKey, items, 60);
      } catch {
        // 缓存失败不影响主流程
      }
    }

    return {
      ok: true,
      data: items,
    };
  }

  async findOneBySlug(slug: string): Promise<CaseResponse<CaseItem | null>> {
    const entity = await this.repository.findOne({
      where: { slug, published: true },
    });
    return {
      ok: true,
      data: entity ? toCaseItem(entity) : null,
    };
  }

  // ---------------- Admin methods ----------------

  async adminFindAll(): Promise<Case[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  async adminFindOne(id: string): Promise<Case> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Case not found');
    }
    return entity;
  }

  async adminCreate(dto: CreateCaseDto): Promise<Case> {
    const entity = this.repository.create({
      slug: dto.slug,
      title: dto.title,
      scene: dto.scene,
      budget: dto.budget,
      difficulty: dto.difficulty,
      materialGrade: dto.materialGrade,
      materialName: dto.materialName,
      materialHref: dto.materialHref,
      area: dto.area,
      timeline: dto.timeline,
      challenge: dto.challenge,
      solution: dto.solution,
      materials: dto.materials ?? [],
      processImages: dto.processImages ?? [],
      beforeImages: dto.beforeImages ?? [],
      afterImages: dto.afterImages ?? [],
      relatedProblems: dto.relatedProblems ?? [],
      coverImage: dto.coverImage ?? null,
      videoUrl: dto.videoUrl ?? null,
      seoTitle: dto.seoTitle ?? null,
      seoDescription: dto.seoDescription ?? null,
      published: dto.published ?? false,
      tags: dto.tags ?? [],
      coverLayout: dto.coverLayout ?? 'single',
      publishMeta: dto.publishMeta ?? {},
    });
    const saved = await this.repository.save(entity);
    await this.bumpCacheVersionSafely();
    return saved;
  }

  async adminUpdate(id: string, dto: UpdateCaseDto): Promise<Case> {
    const existing = await this.adminFindOne(id);
    const merged: Case = {
      ...existing,
      slug: dto.slug ?? existing.slug,
      title: dto.title ?? existing.title,
      scene: dto.scene ?? existing.scene,
      budget: dto.budget ?? existing.budget,
      difficulty: dto.difficulty ?? existing.difficulty,
      materialGrade: dto.materialGrade ?? existing.materialGrade,
      materialName: dto.materialName ?? existing.materialName,
      materialHref: dto.materialHref ?? existing.materialHref,
      area: dto.area ?? existing.area,
      timeline: dto.timeline ?? existing.timeline,
      challenge:
        dto.challenge !== undefined ? dto.challenge : existing.challenge,
      solution: dto.solution !== undefined ? dto.solution : existing.solution,
      materials: dto.materials ?? existing.materials,
      processImages: dto.processImages ?? existing.processImages,
      beforeImages: dto.beforeImages ?? existing.beforeImages,
      afterImages: dto.afterImages ?? existing.afterImages,
      relatedProblems: dto.relatedProblems ?? existing.relatedProblems,
      coverImage:
        dto.coverImage !== undefined ? dto.coverImage : existing.coverImage,
      videoUrl: dto.videoUrl !== undefined ? dto.videoUrl : existing.videoUrl,
      seoTitle: dto.seoTitle !== undefined ? dto.seoTitle : existing.seoTitle,
      seoDescription:
        dto.seoDescription !== undefined
          ? dto.seoDescription
          : existing.seoDescription,
      published:
        dto.published !== undefined ? dto.published : existing.published,
      tags: dto.tags ?? existing.tags,
      coverLayout: dto.coverLayout ?? existing.coverLayout,
      publishMeta: dto.publishMeta ?? existing.publishMeta,
    };
    await this.repository.save(merged);
    await this.bumpCacheVersionSafely();
    return merged;
  }

  async adminRemove(id: string): Promise<void> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Case not found');
    }
    await this.repository.delete(id);
    await this.bumpCacheVersionSafely();
  }

  private async buildCacheKey(
    sceneKey: string,
    budgetKey: string,
    difficultyKey: string,
    searchKey: string,
  ): Promise<string | null> {
    try {
      const versionRaw = await this.cache.get<number>(`${this.cachePrefix}:v`);
      const version =
        typeof versionRaw === 'number' && Number.isFinite(versionRaw)
          ? versionRaw
          : 0;
      return `${this.cachePrefix}:${version}:${sceneKey}:${budgetKey}:${difficultyKey}:${searchKey}`;
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
