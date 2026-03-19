import { Controller, Get, Param, Query } from '@nestjs/common';

import { CaseService, CaseResponse } from './case.service';
import { CaseItem } from './case.constants';
import { CaseQueryDto } from './dto/case-query.dto';
import { SlugParamDto } from '../common/dto/slug-param.dto';

@Controller('cases')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Get()
  async findAll(
    @Query() query: CaseQueryDto,
  ): Promise<CaseResponse<CaseItem[]>> {
    return this.caseService.findAll({
      scene: query.scene,
      budget: query.budget,
      difficulty: query.difficulty,
      q: query.q,
    });
  }

  @Get(':slug')
  async findOne(
    @Param() param: SlugParamDto,
  ): Promise<CaseResponse<CaseItem | null>> {
    return this.caseService.findOneBySlug(param.slug);
  }
}
