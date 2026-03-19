import { Controller, Get, Logger, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { MaterialService, MaterialFull } from './material.service';
import { MaterialCompareQueryDto } from './dto/material-compare-query.dto';
import { SlugParamDto } from '../common/dto/slug-param.dto';

@Controller('materials')
export class MaterialController {
  private readonly logger = new Logger(MaterialController.name);

  constructor(private readonly materialService: MaterialService) {}

  @Get()
  async findAll(): Promise<MaterialFull[]> {
    this.logger.log('GET /api/materials 列表请求');
    return this.materialService.findAll();
  }

  @Get('compare/export')
  async exportCompare(
    @Query() query: MaterialCompareQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const slugs =
      query.compare
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5) ?? [];

    const items = await this.materialService.findForCompare(slugs);

    const header = [
      '名称',
      '英文名',
      '分类',
      '纹理',
      '颜色分组',
      '参考价格区间',
      '硬度',
      '稳定性',
      '可加工性',
      '用途',
    ];

    const rows = items.map((item) => [
      item.name,
      '',
      '',
      item.textureType ?? '',
      item.colorGroup,
      '',
      '',
      '',
      '',
      '',
    ]);

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const csv = [header, ...rows]
      .map((row) => row.map((col) => escapeCsv(String(col))).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="mupi-compare.csv"',
    );
    res.setHeader('Cache-Control', 'no-store');
    res.send(csv);
  }

  @Get(':slug')
  async findOne(@Param() param: SlugParamDto): Promise<MaterialFull | null> {
    this.logger.log(`GET /api/materials/${param.slug} 详情请求`);
    return this.materialService.findOneBySlug(param.slug);
  }
}
