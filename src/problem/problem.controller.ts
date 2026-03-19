import { Controller, Get, Param } from '@nestjs/common';

import { ProblemService } from './problem.service';
import { ProblemDetail } from './problem.constants';
import { SlugParamDto } from '../common/dto/slug-param.dto';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  async findAll(): Promise<ProblemDetail[]> {
    return this.problemService.findAll();
  }

  @Get(':slug')
  async findOne(@Param() param: SlugParamDto): Promise<ProblemDetail | null> {
    return this.problemService.findOneBySlug(param.slug);
  }
}
