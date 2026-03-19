import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Case } from './entities/case.entity';
import { CASES, CaseItem } from './case.constants';

@Injectable()
export class CaseSeedService {
  constructor(
    @InjectRepository(Case)
    private readonly repository: Repository<Case>,
  ) {}

  async runSeed(): Promise<{ count: number }> {
    for (const src of CASES) {
      const entityData = {
        slug: src.slug,
        title: src.title,
        scene: src.scene,
        budget: src.budget,
        difficulty: src.difficulty,
        materialGrade: src.materialGrade,
        materialName: src.materialName,
        materialHref: src.materialHref,
        area: src.area,
        timeline: src.timeline,
        challenge: src.challenge,
        solution: src.solution,
        materials: src.materials ?? [],
        processImages: src.processImages ?? [],
        relatedProblems: src.relatedProblems ?? [],
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
          '[CaseSeedService] Failed to seed slug:',
          src.slug,
          error,
        );
      }
    }
    return { count: CASES.length };
  }
}
