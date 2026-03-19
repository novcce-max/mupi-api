import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { ProjectKit, ProjectKitPayload } from './entities/project-kit.entity';

function generateShareId(): string {
  return randomBytes(10).toString('base64url');
}

@Injectable()
export class ProjectKitService {
  constructor(
    @InjectRepository(ProjectKit)
    private readonly repo: Repository<ProjectKit>,
  ) {}

  async create(
    payload: ProjectKitPayload,
    memberId?: string | null,
  ): Promise<{ id: string; shareId: string }> {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const shareId = generateShareId();

      const entity = this.repo.create({
        shareId,
        memberId: memberId ?? null,
        name: payload.name ?? '',
        payload: {
          name: payload.name ?? '',
          materials: Array.isArray(payload.materials) ? payload.materials : [],
          cases: Array.isArray(payload.cases) ? payload.cases : [],
          problems: Array.isArray(payload.problems) ? payload.problems : [],
        },
      });

      try {
        const saved = await this.repo.save(entity);
        return { id: saved.id, shareId: saved.shareId };
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code !== '23505') {
          throw error;
        }
        if (attempt === maxAttempts - 1) {
          throw new InternalServerErrorException(
            'Failed to generate unique shareId after several attempts',
          );
        }
        // 23505 且未达到最大重试次数，则继续循环重新生成 shareId
      }
    }

    // 理论上不会到这里，但保证类型完整性
    throw new InternalServerErrorException(
      'Failed to generate unique shareId after several attempts',
    );
  }

  async findByShareId(shareId: string): Promise<ProjectKitPayload | null> {
    const row = await this.repo.findOne({ where: { shareId } });
    if (!row?.payload) return null;
    const p = row.payload;
    return {
      name: p.name ?? row.name ?? '',
      materials: Array.isArray(p.materials) ? p.materials : [],
      cases: Array.isArray(p.cases) ? p.cases : [],
      problems: Array.isArray(p.problems) ? p.problems : [],
    };
  }
}
