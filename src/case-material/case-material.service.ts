import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Case } from '../case/entities/case.entity';
import { Material } from '../material/entities/material.entity';
import { CaseMaterial } from './entities/case-material.entity';

export type LinkedCaseSummary = {
  id: string;
  slug: string;
  title: string;
  scene: string;
  budget: string;
  difficulty: string;
  materialName: string;
  coverImage: string | null;
};

export type LinkedMaterialSummary = {
  id: string;
  slug: string;
  name: string;
  colorGroup: string;
  textureType: string | null;
  thickness: string | null;
  image: string | null;
  status: string;
};

function normalizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = String(raw ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function coverFromMaterial(entity: Material): string | null {
  const images = Array.isArray(entity.images) ? entity.images : [];
  const uploaded = images.find(
    (src) =>
      typeof src === 'string' &&
      src.trim() &&
      !src.trim().startsWith('/images/'),
  );
  if (uploaded) return uploaded.trim();
  const propsImage =
    entity.properties && typeof entity.properties.image === 'string'
      ? entity.properties.image.trim()
      : '';
  if (propsImage) return propsImage;
  return images[0]?.trim() || null;
}

@Injectable()
export class CaseMaterialService {
  constructor(
    @InjectRepository(CaseMaterial)
    private readonly linkRepo: Repository<CaseMaterial>,
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
  ) {}

  async getMaterialIdsForCase(caseId: string): Promise<string[]> {
    const rows = await this.linkRepo.find({
      where: { caseId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return rows.map((row) => row.materialId);
  }

  async getCaseIdsForMaterial(materialId: string): Promise<string[]> {
    const rows = await this.linkRepo.find({
      where: { materialId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return rows.map((row) => row.caseId);
  }

  async setMaterialsForCase(
    caseId: string,
    materialIds: unknown,
  ): Promise<string[]> {
    const ids = normalizeIds(materialIds);
    if (ids.length > 0) {
      const existing = await this.materialRepo.find({
        where: { id: In(ids) },
        select: ['id'],
      });
      const valid = new Set(existing.map((item) => item.id));
      const filtered = ids.filter((id) => valid.has(id));
      await this.replaceLinksForCase(caseId, filtered);
      return filtered;
    }
    await this.replaceLinksForCase(caseId, []);
    return [];
  }

  async setCasesForMaterial(
    materialId: string,
    caseIds: unknown,
  ): Promise<string[]> {
    const ids = normalizeIds(caseIds);
    if (ids.length > 0) {
      const existing = await this.caseRepo.find({
        where: { id: In(ids) },
        select: ['id'],
      });
      const valid = new Set(existing.map((item) => item.id));
      const filtered = ids.filter((id) => valid.has(id));
      await this.replaceLinksForMaterial(materialId, filtered);
      return filtered;
    }
    await this.replaceLinksForMaterial(materialId, []);
    return [];
  }

  async findPublishedCasesForMaterial(
    materialId: string,
  ): Promise<LinkedCaseSummary[]> {
    const rows = await this.linkRepo.find({
      where: { materialId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    if (rows.length === 0) return [];
    const caseIds = rows.map((row) => row.caseId);
    const cases = await this.caseRepo.find({
      where: { id: In(caseIds), published: true },
    });
    const byId = new Map(cases.map((item) => [item.id, item]));
    return rows
      .map((row) => byId.get(row.caseId))
      .filter((item): item is Case => Boolean(item))
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        scene: item.scene,
        budget: item.budget,
        difficulty: item.difficulty,
        materialName: item.materialName,
        coverImage: item.coverImage ?? null,
      }));
  }

  async findPublishedMaterialsForCase(
    caseId: string,
  ): Promise<LinkedMaterialSummary[]> {
    const rows = await this.linkRepo.find({
      where: { caseId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    if (rows.length === 0) return [];
    const materialIds = rows.map((row) => row.materialId);
    const materials = await this.materialRepo.find({
      where: { id: In(materialIds), status: 'published' },
    });
    const byId = new Map(materials.map((item) => [item.id, item]));
    return rows
      .map((row) => byId.get(row.materialId))
      .filter((item): item is Material => Boolean(item))
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        colorGroup: item.colorGroup,
        textureType: item.textureType ?? null,
        thickness: item.thickness ?? null,
        image: coverFromMaterial(item),
        status: item.status,
      }));
  }

  async findPublishedCasesByMaterialSlug(
    slug: string,
  ): Promise<LinkedCaseSummary[]> {
    const material = await this.materialRepo.findOne({
      where: { slug, status: 'published' },
      select: ['id'],
    });
    if (!material) return [];
    return this.findPublishedCasesForMaterial(material.id);
  }

  async findPublishedMaterialsByCaseSlug(
    slug: string,
  ): Promise<LinkedMaterialSummary[]> {
    const caseEntity = await this.caseRepo.findOne({
      where: { slug, published: true },
      select: ['id'],
    });
    if (!caseEntity) return [];
    return this.findPublishedMaterialsForCase(caseEntity.id);
  }

  /** 后台回填遗留字段时可用（含草稿） */
  async findMaterialById(materialId: string): Promise<Material | null> {
    return this.materialRepo.findOne({ where: { id: materialId } });
  }

  private async replaceLinksForCase(
    caseId: string,
    materialIds: string[],
  ): Promise<void> {
    await this.linkRepo.delete({ caseId });
    if (materialIds.length === 0) return;
    const rows = materialIds.map((materialId, index) =>
      this.linkRepo.create({
        caseId,
        materialId,
        sortOrder: index,
      }),
    );
    await this.linkRepo.save(rows);
  }

  private async replaceLinksForMaterial(
    materialId: string,
    caseIds: string[],
  ): Promise<void> {
    await this.linkRepo.delete({ materialId });
    if (caseIds.length === 0) return;
    const rows = caseIds.map((caseId, index) =>
      this.linkRepo.create({
        caseId,
        materialId,
        sortOrder: index,
      }),
    );
    await this.linkRepo.save(rows);
  }
}
