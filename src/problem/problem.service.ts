import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Problem } from './entities/problem.entity';
import { ProblemDetail, ProblemSymptom } from './problem.constants';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

function toProblemDetail(entity: Problem): ProblemDetail {
  return {
    slug: entity.slug,
    category: entity.category as ProblemDetail['category'],
    title: entity.title,
    summary: entity.summary,
    heroTitle: entity.heroTitle,
    heroSubtitle: entity.heroSubtitle,
    heroImage: entity.heroImage,
    symptoms: (Array.isArray(entity.symptoms)
      ? entity.symptoms
      : []) as ProblemSymptom[],
    reasons: Array.isArray(entity.reasons) ? entity.reasons : [],
    steps: Array.isArray(entity.steps) ? entity.steps : [],
    tools: Array.isArray(entity.tools) ? entity.tools : [],
    materials: Array.isArray(entity.materials) ? entity.materials : [],
    preventions: Array.isArray(entity.preventions) ? entity.preventions : [],
    faq: Array.isArray(entity.faq) ? entity.faq : [],
    recommendedMaterialSlugs: Array.isArray(entity.recommendedMaterialSlugs)
      ? entity.recommendedMaterialSlugs
      : [],
    status: entity.status,
    tags: Array.isArray(entity.tags) ? entity.tags : [],
    coverLayout: entity.coverLayout,
    publishMeta: entity.publishMeta ?? {},
  };
}

@Injectable()
export class ProblemService {
  constructor(
    @InjectRepository(Problem)
    private readonly repository: Repository<Problem>,
  ) {}

  async findAll(): Promise<ProblemDetail[]> {
    const qb = this.repository.createQueryBuilder('problem');
    qb.where('problem.status = :status', { status: 'published' });
    qb.orderBy(
      "(CASE WHEN (problem.publish_meta->>'featuredOnHome') IN ('true', 't', '1', 'True') THEN 1 ELSE 0 END)",
      'DESC',
    ).addOrderBy('problem.id', 'ASC');

    const list = await qb.getMany();
    return list.map(toProblemDetail);
  }

  async findOneBySlug(slug: string): Promise<ProblemDetail | null> {
    const entity = await this.repository.findOne({
      where: { slug, status: 'published' },
    });
    return entity ? toProblemDetail(entity) : null;
  }

  // ---------------- Admin methods ----------------

  async adminFindAll(): Promise<Problem[]> {
    return this.repository.find({
      order: { id: 'ASC' },
    });
  }

  async adminFindOne(id: string): Promise<Problem> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Problem not found');
    }
    return entity;
  }

  async adminCreate(dto: CreateProblemDto): Promise<Problem> {
    const entity = this.repository.create({
      slug: dto.slug,
      category: dto.category,
      title: dto.title,
      summary: dto.summary,
      heroTitle: dto.heroTitle ?? dto.title,
      heroSubtitle: dto.heroSubtitle ?? '',
      heroImage: dto.heroImage ?? '',
      symptoms: dto.symptoms ?? [],
      reasons: dto.reasons ?? [],
      steps: dto.steps ?? [],
      tools: dto.tools ?? [],
      materials: dto.materials ?? [],
      preventions: dto.preventions ?? [],
      faq: dto.faq ?? [],
      recommendedMaterialSlugs: dto.recommendedMaterialSlugs ?? [],
      status: dto.status ?? 'draft',
      tags: dto.tags ?? [],
      coverLayout: dto.coverLayout ?? 'single',
      publishMeta: dto.publishMeta ?? {},
    });
    return this.repository.save(entity);
  }

  async adminUpdate(id: string, dto: UpdateProblemDto): Promise<Problem> {
    const existing = await this.adminFindOne(id);
    const next: Problem = {
      ...existing,
      slug: dto.slug ?? existing.slug,
      category: dto.category ?? existing.category,
      title: dto.title ?? existing.title,
      summary: dto.summary ?? existing.summary,
      heroTitle:
        dto.heroTitle !== undefined ? dto.heroTitle : existing.heroTitle,
      heroSubtitle:
        dto.heroSubtitle !== undefined
          ? dto.heroSubtitle
          : existing.heroSubtitle,
      heroImage:
        dto.heroImage !== undefined ? dto.heroImage : existing.heroImage,
      symptoms: dto.symptoms ?? existing.symptoms,
      reasons: dto.reasons ?? existing.reasons,
      steps: dto.steps ?? existing.steps,
      tools: dto.tools ?? existing.tools,
      materials: dto.materials ?? existing.materials,
      preventions: dto.preventions ?? existing.preventions,
      faq: dto.faq ?? existing.faq,
      recommendedMaterialSlugs:
        dto.recommendedMaterialSlugs ?? existing.recommendedMaterialSlugs,
      status: dto.status ?? existing.status,
      tags: dto.tags ?? existing.tags,
      coverLayout: dto.coverLayout ?? existing.coverLayout,
      publishMeta: dto.publishMeta ?? existing.publishMeta,
    };
    await this.repository.save(next);
    return next;
  }

  async adminRemove(id: string): Promise<void> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Problem not found');
    }
    await this.repository.delete(id);
  }
}
