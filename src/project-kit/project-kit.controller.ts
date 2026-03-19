import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { ProjectKitService } from './project-kit.service';
import { CreateProjectKitDto } from './dto/create-project-kit.dto';
import { ProjectKitShareQueryDto } from './dto/project-kit-share-query.dto';

function getMemberIdFromRequest(req: Request): string | null {
  return (
    (req as Request & { user?: { memberId?: string } }).user?.memberId ?? null
  );
}

@Controller('project-kit')
export class ProjectKitController {
  constructor(private readonly projectKitService: ProjectKitService) {}

  @Post()
  async create(
    @Body() dto: CreateProjectKitDto,
    @Req() req: Request,
  ): Promise<{ id: string; shareId: string; shareUrl?: string }> {
    const memberId = getMemberIdFromRequest(req);
    const payload = {
      name: dto.name,
      materials: dto.materials ?? [],
      cases: dto.cases ?? [],
      problems: dto.problems ?? [],
    };
    const { id, shareId } = await this.projectKitService.create(
      payload,
      memberId,
    );
    const baseUrl = process.env.FRONTEND_BASE_URL || '';
    const shareUrl = `${baseUrl}/project-kit/share?id=${encodeURIComponent(shareId)}`;
    return { id, shareId, shareUrl };
  }

  @Get('share')
  async getByShareId(@Query() query: ProjectKitShareQueryDto): Promise<{
    name: string;
    materials: string[];
    cases: string[];
    problems: string[];
  } | null> {
    const shareId = query.id?.trim();
    if (!shareId) {
      return null;
    }
    const payload = await this.projectKitService.findByShareId(shareId);
    if (!payload) {
      return null;
    }
    return payload;
  }
}
