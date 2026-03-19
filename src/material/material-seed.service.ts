import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Material } from './entities/material.entity';
import {
  MATERIALS_SEED_DATA,
  MaterialSeedItem,
} from './material-data.constants';

@Injectable()
export class MaterialSeedService {
  constructor(
    @InjectRepository(Material)
    private readonly repository: Repository<Material>,
  ) {}

  async runSeed(): Promise<{ count: number }> {
    for (const src of MATERIALS_SEED_DATA) {
      const images =
        src.detailImages?.length > 0
          ? [
              src.image,
              ...src.detailImages.filter((u) => u !== src.image),
            ].filter(Boolean)
          : src.image
            ? [src.image]
            : [];

      const entityData: Partial<Material> = {
        name: src.name,
        slug: src.slug,
        colorGroup: src.colorGroup,
        textureType: src.texture ?? null,
        finish: null,
        thickness: src.thickness ?? null,
        images: images.length > 0 ? images : [],
        properties: {
          aliases: src.aliases,
          englishName: src.englishName,
          category: src.category,
          texture: src.texture,
          color: src.color,
          usage: src.usage,
          size: src.size,
          density: src.density,
          hardness: src.hardness,
          machinability: src.machinability,
          stability: src.stability,
          processSuggestion: src.processSuggestion,
          maintenance: src.maintenance,
          certification: src.certification,
          priceRange: src.priceRange,
          intro: src.intro,
          subtitle: src.subtitle,
          image: src.image,
          detailImages: src.detailImages,
          tags: src.tags,
          seoText: src.seoText,
        },
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
          '[MaterialSeedService] Failed to seed slug:',
          src.slug,
          error,
        );
      }
    }
    return { count: MATERIALS_SEED_DATA.length };
  }
}
