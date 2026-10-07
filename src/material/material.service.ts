import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { Material } from './entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

/** 与前端 MaterialItem 对齐的完整结构（entity + properties 合并） */
export type MaterialFull = Record<string, unknown>;

function isPlaceholderImage(src: unknown): boolean {
  return typeof src !== 'string' || !src.trim() || src.trim().startsWith('/images/');
}

/** 后台图库第一张真实图就是封面。properties.image 里的旧占位图不能盖过图库。 */
function coverFromGallery(propsImage: unknown, images: string[]): string | null {
  const uploaded = images.find((src) => !isPlaceholderImage(src));
  if (uploaded) return uploaded.trim();
  if (typeof propsImage === 'string' && propsImage.trim()) return propsImage.trim();
  return images[0] ?? null;
}

function toFullMaterial(entity: Material): MaterialFull {
  const props = entity.properties ?? {};
  const images = Array.isArray(entity.images) ? entity.images : [];
  const galleryHasUpload = images.some((src) => !isPlaceholderImage(src));
  return {
    slug: entity.slug,
    name: entity.name,
    colorGroup: entity.colorGroup,
    textureType: entity.textureType ?? null,
    thickness: entity.thickness ?? null,
    images,
    status: entity.status,
    tags: Array.isArray(entity.tags) ? entity.tags : [],
    coverLayout: entity.coverLayout,
    publishMeta: entity.publishMeta ?? {},
    videoUrl: entity.videoUrl ?? null,
    ...props,
    image: coverFromGallery(props.image, images),
    detailImages: galleryHasUpload
      ? images
      : Array.isArray(props.detailImages)
        ? props.detailImages
        : images,
  };
}

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
  ) {}

  async findAll(): Promise<MaterialFull[]> {
    const qb = this.materialRepo.createQueryBuilder('material');
    qb.where('material.status = :status', { status: 'published' });
    qb.orderBy(
      "(CASE WHEN (material.publish_meta->>'featuredOnHome') IN ('true', 't', '1', 'True') THEN 1 ELSE 0 END)",
      'DESC',
    ).addOrderBy('material.id', 'ASC');

    const items = await qb.getMany();
    return items.map(toFullMaterial);
  }

  async findOneBySlug(slug: string): Promise<MaterialFull | null> {
    const entity = await this.materialRepo.findOne({
      where: { slug, status: 'published' },
    });
    return entity ? toFullMaterial(entity) : null;
  }

  async findForCompare(slugs: string[]): Promise<Material[]> {
    const qb = this.materialRepo.createQueryBuilder('material');

    if (slugs.length > 0) {
      qb.where('material.slug IN (:...slugs)', { slugs });
    }

    qb.orderBy('material.id', 'ASC').take(5);

    return qb.getMany();
  }

  // ---------------- Admin methods ----------------

  async adminFindAll(): Promise<Material[]> {
    return this.materialRepo.find({
      order: { id: 'ASC' },
    });
  }

  async adminFindOne(id: string): Promise<Material> {
    const material = await this.materialRepo.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('Material not found');
    }
    return material;
  }

  async adminFindOneBySlug(slug: string): Promise<Material | null> {
    const clean = slug.trim();
    if (!clean) return null;
    return this.materialRepo.findOne({ where: { slug: clean } });
  }

  async adminCreate(dto: CreateMaterialDto): Promise<Material> {
    const entity = this.materialRepo.create({
      name: dto.name,
      slug: dto.slug,
      colorGroup: dto.colorGroup,
      textureType: dto.textureType ?? null,
      finish: dto.finish ?? null,
      thickness: dto.thickness ?? null,
      images: dto.images ?? [],
      properties: dto.properties ?? null,
      status: dto.status ?? 'draft',
      tags: dto.tags ?? [],
      coverLayout: dto.coverLayout ?? 'single',
      publishMeta: dto.publishMeta ?? {},
      videoUrl: dto.videoUrl ?? null,
    });
    return this.materialRepo.save(entity);
  }

  async adminUpdate(id: string, dto: UpdateMaterialDto): Promise<Material> {
    const material = await this.adminFindOne(id);
    const next: QueryDeepPartialEntity<Material> = {
      name: dto.name ?? material.name,
      slug: dto.slug ?? material.slug,
      colorGroup: dto.colorGroup ?? material.colorGroup,
      textureType:
        dto.textureType !== undefined ? dto.textureType : material.textureType,
      finish: dto.finish !== undefined ? dto.finish : material.finish,
      thickness:
        dto.thickness !== undefined ? dto.thickness : material.thickness,
      images: dto.images ?? material.images,
      properties:
        (dto.properties as QueryDeepPartialEntity<Record<
          string,
          unknown
        > | null>) ??
        (material.properties as QueryDeepPartialEntity<Record<
          string,
          unknown
        > | null>),
      status: dto.status ?? material.status,
      tags: dto.tags ?? material.tags,
      coverLayout: dto.coverLayout ?? material.coverLayout,
      videoUrl: dto.videoUrl !== undefined ? dto.videoUrl : material.videoUrl,
      publishMeta:
        (dto.publishMeta as QueryDeepPartialEntity<Record<string, unknown>>) ??
        (material.publishMeta as QueryDeepPartialEntity<
          Record<string, unknown>
        >),
    };
    await this.materialRepo.update(id, next);
    return this.adminFindOne(id);
  }

  async adminRemove(id: string): Promise<void> {
    const existing = await this.materialRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Material not found');
    }
    await this.materialRepo.delete(id);
  }
}
