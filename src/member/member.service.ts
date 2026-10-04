import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Member } from './entities/member.entity';
import { MemberStats } from './entities/member-stats.entity';
import { MemberHistory } from './entities/member-history.entity';

export interface MemberOverview {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  lastLoginAt: Date | null;
  stats: {
    points: number;
    favoritesCount: number;
    viewsCount: number;
  } | null;
  recentHistory: {
    slug: string;
    historyType: string;
  }[];
}

export interface MemberResponse<T = unknown> {
  ok: boolean;
  data: T;
}

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    @InjectRepository(MemberStats)
    private readonly statsRepo: Repository<MemberStats>,
    @InjectRepository(MemberHistory)
    private readonly historyRepo: Repository<MemberHistory>,
  ) {}

  async getOverviewById(
    id: string,
  ): Promise<MemberResponse<MemberOverview | null>> {
    const member = await this.memberRepo.findOne({
      where: { id },
      relations: ['stats'],
    });

    if (!member) {
      return {
        ok: true,
        data: null,
      };
    }

    const histories = await this.historyRepo.find({
      where: { memberId: member.id },
      order: { id: 'DESC' },
      take: 20,
    });

    const overview: MemberOverview = {
      id: member.id,
      nickname: member.nickname,
      avatarUrl: member.avatarUrl,
      email: member.email ?? null,
      phone: member.phone ?? null,
      lastLoginAt: member.lastLoginAt,
      stats: member.stats
        ? {
            points: member.stats.points,
            favoritesCount: member.stats.favoritesCount,
            viewsCount: member.stats.viewsCount,
          }
        : null,
      recentHistory: histories.map((h) => ({
        slug: h.slug,
        historyType: h.historyType,
      })),
    };

    return {
      ok: true,
      data: overview,
    };
  }

  async getHistoryById(id: string): Promise<MemberResponse<MemberHistory[]>> {
    const histories = await this.historyRepo.find({
      where: { memberId: id },
      order: { id: 'DESC' },
    });

    return {
      ok: true,
      data: histories,
    };
  }

  async updateNickname(
    id: string,
    nickname: string,
  ): Promise<MemberResponse<MemberOverview | null>> {
    const trimmed = nickname.trim();
    if (!trimmed) {
      throw new BadRequestException('昵称为空');
    }

    const member = await this.memberRepo.findOne({
      where: { id },
    });

    if (!member) {
      return {
        ok: true,
        data: null,
      };
    }

    member.nickname = trimmed.slice(0, 100);
    await this.memberRepo.save(member);

    return this.getOverviewById(id);
  }
}
