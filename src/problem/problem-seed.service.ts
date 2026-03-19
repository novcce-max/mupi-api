import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Problem } from './entities/problem.entity';
import { PROBLEM_DETAILS, ProblemDetail } from './problem.constants';

@Injectable()
export class ProblemSeedService {
  constructor(
    @InjectRepository(Problem)
    private readonly repository: Repository<Problem>,
  ) {}

  async runSeed(): Promise<{ count: number }> {
    const list = Object.values(PROBLEM_DETAILS);

    for (const src of list) {
      const entityData = {
        slug: src.slug,
        category: src.category,
        title: src.title,
        summary: src.summary,
        heroTitle: src.heroTitle,
        heroSubtitle: src.heroSubtitle,
        heroImage: src.heroImage,
        symptoms: src.symptoms ?? [],
        reasons: src.reasons ?? [],
        steps: src.steps ?? [],
        tools: src.tools ?? [],
        materials: src.materials ?? [],
        preventions: src.preventions ?? [],
        faq: src.faq ?? [],
        recommendedMaterialSlugs: src.recommendedMaterialSlugs ?? [],
      };

      try {
        const existing = await this.repository.findOne({
          where: { slug: src.slug },
        });
        if (existing) {
          await this.repository.update(
            existing.id,
            entityData as Record<string, unknown>,
          );
        } else {
          const entity = this.repository.create(entityData);
          await this.repository.save(entity);
        }
      } catch (error) {
        console.error(
          '[ProblemSeedService] Failed to seed slug:',
          src.slug,
          error,
        );
      }
    }
    return { count: list.length };
  }
}
