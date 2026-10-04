import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import type { CreateVeneerKnowledgeDto } from './dto/create-veneer-knowledge.dto';
import type { UpdateVeneerKnowledgeDto } from './dto/update-veneer-knowledge.dto';
import { VeneerKnowledge } from './entities/veneer-knowledge.entity';

@Injectable()
export class VeneerKnowledgeService {
  constructor(
    @InjectRepository(VeneerKnowledge)
    private readonly repo: Repository<VeneerKnowledge>,
  ) {}

  async list(params?: {
    q?: string;
    status?: string;
  }): Promise<VeneerKnowledge[]> {
    const qb = this.repo.createQueryBuilder('v').orderBy('v.updatedAt', 'DESC');
    if (params?.status?.trim()) {
      qb.andWhere('v.status = :status', { status: params.status.trim() });
    }
    if (params?.q?.trim()) {
      qb.andWhere('v.display_name ILIKE :q', { q: `%${params.q.trim()}%` });
    }
    return qb.getMany();
  }

  async findOne(id: string): Promise<VeneerKnowledge> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('veneer knowledge not found');
    return row;
  }

  async create(dto: CreateVeneerKnowledgeDto): Promise<VeneerKnowledge> {
    const id = randomUUID();
    const veneer: Record<string, unknown> = {
      ...dto.veneer,
      id,
      lastUpdated: new Date().toISOString(),
    };
    const name =
      typeof veneer.name === 'string' && veneer.name.trim()
        ? veneer.name.trim().slice(0, 200)
        : '未命名木皮';

    const row = this.repo.create({
      status: 'draft',
      displayName: name,
      sourceUrl: dto.sourceUrl?.trim() ?? null,
      sourceType: dto.sourceType ?? null,
      sourceDate: dto.sourceDate?.trim() ?? null,
      rawContentExcerpt: dto.rawContentExcerpt?.trim().slice(0, 8000) ?? null,
      rawAiExtract: dto.rawAiExtract ?? null,
      veneer,
    });
    return this.repo.save(row);
  }

  async update(
    id: string,
    dto: UpdateVeneerKnowledgeDto,
  ): Promise<VeneerKnowledge> {
    const row = await this.findOne(id);

    if (dto.status !== undefined) {
      row.status = dto.status;
    }
    if (dto.displayName !== undefined) {
      row.displayName = dto.displayName.trim().slice(0, 200);
    }
    if (dto.veneer !== undefined) {
      const next: Record<string, unknown> = {
        ...dto.veneer,
        id,
        lastUpdated: new Date().toISOString(),
      };
      row.veneer = next;
      if (typeof next.name === 'string' && next.name.trim()) {
        row.displayName = next.name.trim().slice(0, 200);
      }
    }
    if (dto.linkedWikiSlug !== undefined) {
      const t = (dto.linkedWikiSlug ?? '').trim();
      row.linkedWikiSlug = t ? t.slice(0, 200) : null;
    }
    if (dto.linkedMaterialSlug !== undefined) {
      const t = (dto.linkedMaterialSlug ?? '').trim();
      row.linkedMaterialSlug = t ? t.slice(0, 200) : null;
    }

    return this.repo.save(row);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.repo.remove(row);
  }
}
