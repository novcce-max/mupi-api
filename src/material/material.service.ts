import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import {
  CaseMaterialService,
  LinkedCaseSummary,
} from '../case-material/case-material.service';
import { Material } from './entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

/** 与前端 MaterialItem 对齐的完整结构（entity + properties 合并） */
export type MaterialFull = Record<string, unknown> & {
  linkedCases?: LinkedCaseSummary[];
};

export type AdminMaterialDetail = Material & { caseIds: string[] };

function isPlaceholderImage(src: unknown): boolean {
  return (
    typeof src !== 'string' || !src.trim() || src.trim().startsWith('/images/')
  );
}

/** 后台图库第一张真实图就是封面。properties.image 里的旧占位图不能盖过图库。 */
function coverFromGallery(
  propsImage: unknown,
  images: string[],
): string | null {
  const uploaded = images.find((src) => !isPlaceholderImage(src));
  if (uploaded) return uploaded.trim();
  if (typeof propsImage === 'string' && propsImage.trim())
    return propsImage.trim();
  return images[0] ?? null;
}

const VARIANT_LABEL_KEY_MAP: Record<string, string> = {
  直纹: 'zhiwen',
  山纹: 'shanwen',
  树榴: 'shuliu',
  榴纹: 'shuliu',
  鸟眼: 'niaoyan',
  影木: 'yingmu',
  弦切: 'xianqie',
  径切: 'jingqie',
  旋切: 'xuanqie',
  厚皮: 'houpi',
  薄皮: 'baopi',
  染色: 'ranse',
  科技木: 'keji',
  天然: 'tianran',
};

function slugifyVariantKey(label: string): string {
  const trimmed = (label || '').trim();
  const mapped = VARIANT_LABEL_KEY_MAP[trimmed.replace(/\s+/g, '')];
  if (mapped) return mapped;
  const ascii = trimmed
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (ascii && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ascii)) return ascii;
  let h = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    h = (h * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return `v-${h.toString(36)}`;
}

function uniquifyVariantKey(base: string, seen: Set<string>): string {
  let candidate = base;
  if (!seen.has(candidate)) return candidate;
  let n = 2;
  while (seen.has(`${candidate}-${n}`)) n += 1;
  return `${candidate}-${n}`;
}

/** Hub 页内子类：只透传规范化后的数组；非法项丢弃；重复 key 自动加后缀 */
function normalizeVariants(raw: unknown): Record<string, unknown>[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const keyRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const label = String(row.label ?? '').trim();
    if (!label) continue;
    let key = String(row.key ?? '')
      .trim()
      .toLowerCase();
    if (!key || !keyRe.test(key)) {
      key = slugifyVariantKey(label);
    }
    key = uniquifyVariantKey(key, seen);
    seen.add(key);
    const thicknessRaw = row.thickness;
    const thickness = Array.isArray(thicknessRaw)
      ? thicknessRaw.map((v) => String(v).trim()).filter(Boolean)
      : typeof thicknessRaw === 'string' && thicknessRaw.trim()
        ? thicknessRaw
            .split(/[,，、/\s]+/)
            .map((v) => v.trim())
            .filter(Boolean)
        : undefined;
    const images = Array.isArray(row.images)
      ? row.images.map((v) => String(v ?? '').trim()).filter(Boolean)
      : undefined;
    out.push({
      key,
      label,
      ...(row.texture != null && String(row.texture).trim()
        ? { texture: String(row.texture).trim() }
        : {}),
      ...(thickness?.length ? { thickness } : {}),
      ...(row.usageNote != null && String(row.usageNote).trim()
        ? { usageNote: String(row.usageNote).trim() }
        : {}),
      ...(row.priceNote != null && String(row.priceNote).trim()
        ? { priceNote: String(row.priceNote).trim() }
        : {}),
      ...(images?.length ? { images } : {}),
      ...(row.note != null && String(row.note).trim()
        ? { note: String(row.note).trim() }
        : {}),
    });
  }
  return out.length > 0 ? out : undefined;
}

function toFullMaterial(entity: Material): MaterialFull {
  const props = entity.properties ?? {};
  const { variants: _rawVariants, ...restProps } = props;
  const images = Array.isArray(entity.images) ? entity.images : [];
  const galleryHasUpload = images.some((src) => !isPlaceholderImage(src));
  const variants = normalizeVariants(_rawVariants);
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
    ...restProps,
    image: coverFromGallery(props.image, images),
    detailImages: galleryHasUpload
      ? images
      : Array.isArray(props.detailImages)
        ? props.detailImages
        : images,
    ...(variants ? { variants } : {}),
  };
}

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    private readonly caseMaterialService: CaseMaterialService,
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
    if (!entity) return null;
    const full = toFullMaterial(entity);
    try {
      full.linkedCases =
        await this.caseMaterialService.findPublishedCasesForMaterial(entity.id);
    } catch {
      full.linkedCases = [];
    }
    return full;
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

  async adminFindOne(id: string): Promise<AdminMaterialDetail> {
    const material = await this.materialRepo.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('Material not found');
    }
    const caseIds = await this.caseMaterialService.getCaseIdsForMaterial(
      material.id,
    );
    return { ...material, caseIds };
  }

  async adminFindOneBySlug(slug: string): Promise<Material | null> {
    const clean = slug.trim();
    if (!clean) return null;
    return this.materialRepo.findOne({ where: { slug: clean } });
  }

  async adminCreate(dto: CreateMaterialDto): Promise<AdminMaterialDetail> {
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
    const saved = await this.materialRepo.save(entity);
    if (dto.caseIds !== undefined) {
      await this.caseMaterialService.setCasesForMaterial(saved.id, dto.caseIds);
    }
    return this.adminFindOne(saved.id);
  }

  async adminUpdate(
    id: string,
    dto: UpdateMaterialDto,
  ): Promise<AdminMaterialDetail> {
    const material = await this.materialRepo.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('Material not found');
    }
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
    if (dto.caseIds !== undefined) {
      await this.caseMaterialService.setCasesForMaterial(id, dto.caseIds);
    }
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
