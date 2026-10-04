import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { WikiService } from '../wiki/wiki.service';
import { MaterialService } from '../material/material.service';
import { CreateWikiSpeciesDto } from '../wiki/dto/create-wiki-species.dto';
import type { VeneerKnowledge } from './entities/veneer-knowledge.entity';
import { VeneerKnowledgeService } from './veneer-knowledge.service';

function slugifyVeneerTarget(name: string, rowId: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base.length >= 2) return base.slice(0, 200);
  return `vk-${rowId.replace(/-/g, '').slice(0, 12)}`;
}

function guessColorGroup(color: string | undefined): string {
  const c = (color ?? '').trim();
  if (!c) return '中性';
  if (/深|黑|褐|咖|红棕|墨/.test(c)) return '深色';
  if (/浅|白|米|奶|原|鹅黄|浅黄|银/.test(c)) return '浅色';
  return '中性';
}

function veneerName(v: Record<string, unknown>, displayName: string): string {
  const n = v.name;
  if (typeof n === 'string' && n.trim()) return n.trim().slice(0, 200);
  return displayName.trim().slice(0, 200) || '未命名木皮';
}

@Injectable()
export class VeneerKnowledgePublishService {
  constructor(
    private readonly knowledge: VeneerKnowledgeService,
    private readonly wiki: WikiService,
    private readonly materials: MaterialService,
  ) {}

  async publishWiki(
    veneerId: string,
    dto: { slug?: string; publish?: boolean },
  ): Promise<{ wikiSlug: string; wikiId: string; veneer: VeneerKnowledge }> {
    const row = await this.knowledge.findOne(veneerId);
    const v =
      row.veneer && typeof row.veneer === 'object' && !Array.isArray(row.veneer)
        ? row.veneer
        : {};
    const name = veneerName(v, row.displayName);

    const targetSlug = (
      dto.slug?.trim() ||
      row.linkedWikiSlug?.trim() ||
      slugifyVeneerTarget(name, row.id)
    ).slice(0, 200);

    const descParts = [v.patternDescription, v.notes, v.origin]
      .filter(Boolean)
      .map((x) => String(x).trim());
    const description = descParts.length > 0 ? descParts.join('\n\n') : null;

    const tags = Array.isArray(v.tags)
      ? v.tags
          .map((t) => String(t))
          .filter(Boolean)
          .slice(0, 40)
      : [];

    const usage = Array.isArray(v.usage) ? v.usage.map((u) => String(u)) : [];
    const suitableScenes = usage.map((scene) => ({
      scene,
      advice: '',
      risk: '',
    }));

    const properties: Record<string, unknown> = {
      chineseName: name,
      latinName: v.latinName,
      colorTone: v.color,
      grain: v.grain,
      hardness: v.hardness,
      stability: v.stability,
      referencePrice: v.priceLevel,
      moistureSensitivity: v.moistureSensitivity,
      rarity: v.rarity,
      veneerKnowledgeId: row.id,
    };

    const priceRange =
      typeof v.priceLevel === 'string' && v.priceLevel.trim()
        ? v.priceLevel.trim().slice(0, 100)
        : null;

    const wantPublish = dto.publish === true;
    const nextStatus = wantPublish
      ? ('published' as const)
      : ('draft' as const);

    const linked = row.linkedWikiSlug?.trim() || null;
    const wikiByLink = linked
      ? await this.wiki.adminFindOneBySlug(linked)
      : null;
    const wikiByTarget = await this.wiki.adminFindOneBySlug(targetSlug);

    if (wikiByTarget && wikiByLink && wikiByTarget.id !== wikiByLink.id) {
      throw new ConflictException(`slug「${targetSlug}」已被其他百科占用`);
    }
    if (wikiByTarget && !wikiByLink) {
      throw new ConflictException(
        `slug「${targetSlug}」已存在。请在知识库中填写「关联百科 slug」指向该条目，或换用未占用 slug`,
      );
    }

    const updatePayload = {
      name,
      slug: targetSlug,
      description: description ?? undefined,
      suitableScenes,
      priceRange: priceRange ?? undefined,
      properties,
      tags,
      status: nextStatus,
    };

    let savedId: string;

    if (wikiByLink) {
      await this.wiki.adminUpdate(wikiByLink.id, updatePayload);
      savedId = wikiByLink.id;
    } else {
      const createDto: CreateWikiSpeciesDto = {
        name,
        slug: targetSlug,
        category: 'wood',
        description: description ?? undefined,
        photos: [],
        suitableScenes,
        priceRange: priceRange ?? undefined,
        properties,
        tags,
        status: nextStatus,
        coverLayout: 'single',
        publishMeta: {},
      };
      const created = await this.wiki.adminCreate(createDto);
      savedId = created.id;
    }

    const veneerOut = await this.knowledge.update(row.id, {
      linkedWikiSlug: targetSlug,
    });

    return { wikiSlug: targetSlug, wikiId: savedId, veneer: veneerOut };
  }

  async publishMaterial(
    veneerId: string,
    dto: { slug?: string },
  ): Promise<{
    materialSlug: string;
    materialId: string;
    veneer: VeneerKnowledge;
  }> {
    const row = await this.knowledge.findOne(veneerId);
    const v =
      row.veneer && typeof row.veneer === 'object' && !Array.isArray(row.veneer)
        ? row.veneer
        : {};
    const name = veneerName(v, row.displayName);

    const targetSlug = (
      dto.slug?.trim() ||
      row.linkedMaterialSlug?.trim() ||
      slugifyVeneerTarget(name, row.id)
    ).slice(0, 200);

    const material = await this.materials.adminFindOneBySlug(targetSlug);
    if (!material) {
      throw new NotFoundException(
        `未找到 slug 为「${targetSlug}」的选材。请先在 Materials 后台创建条目，或指定已有 slug`,
      );
    }

    const colorGroup = guessColorGroup(
      typeof v.color === 'string' ? v.color : undefined,
    );
    const textureType =
      typeof v.grain === 'string' && v.grain.trim()
        ? v.grain.trim().slice(0, 100)
        : material.textureType;

    const thickness =
      typeof v.thicknessRange === 'string' && v.thicknessRange.trim()
        ? v.thicknessRange.trim().slice(0, 100)
        : material.thickness;

    const mergedTags = new Set<string>(
      [
        ...(Array.isArray(material.tags) ? material.tags : []),
        ...(Array.isArray(v.tags) ? v.tags.map(String) : []),
      ].filter(Boolean),
    );
    const tags = [...mergedTags].slice(0, 40);

    const prevProps =
      material.properties && typeof material.properties === 'object'
        ? { ...material.properties }
        : {};

    const properties: Record<string, unknown> = {
      ...prevProps,
      veneerKnowledgeId: row.id,
      veneerKnowledge: v,
    };

    await this.materials.adminUpdate(material.id, {
      name: name !== material.name ? name : undefined,
      colorGroup,
      textureType: textureType ?? undefined,
      thickness: thickness ?? undefined,
      tags,
      properties,
    });

    const veneerOut = await this.knowledge.update(row.id, {
      linkedMaterialSlug: targetSlug,
    });

    return {
      materialSlug: targetSlug,
      materialId: material.id,
      veneer: veneerOut,
    };
  }
}
