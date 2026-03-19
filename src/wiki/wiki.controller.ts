import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { WikiService } from './wiki.service';
import { CreateWikiDto } from './dto/create-wiki.dto';
import { UpdateWikiDto } from './dto/update-wiki.dto';
import { WikiQueryDto } from './dto/wiki-query.dto';
import { IdParamDto } from '../common/dto/id-param.dto';
import { SlugParamDto } from '../common/dto/slug-param.dto';
import { WikiSpecies } from './entities/wiki-species.entity';

@ApiTags('百科 (Wiki)')
@Controller('wiki-species')
export class WikiController {
  private readonly logger = new Logger(WikiController.name);

  constructor(private readonly wikiService: WikiService) {}

  @Get()
  @ApiOperation({ summary: '获取百科物种列表' })
  @ApiResponse({
    status: 200,
    description: '返回符合过滤条件的百科物种列表',
    type: WikiSpecies,
    isArray: true,
  })
  async findAll(@Query() query: WikiQueryDto): Promise<WikiSpecies[]> {
    this.logger.log(
      `GET /api/wiki-species 列表请求 (category=${query.category ?? 'all'})`,
    );
    return this.wikiService.findAll({
      category: query.category,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':slug')
  @ApiOperation({ summary: '根据 slug 获取百科物种详情' })
  @ApiResponse({
    status: 200,
    description: '返回单个百科物种详情，未找到时返回 null',
    type: WikiSpecies,
  })
  async findOne(@Param() param: SlugParamDto): Promise<WikiSpecies | null> {
    this.logger.log(`GET /api/wiki-species/${param.slug} 详情请求`);
    return this.wikiService.findOneBySlug(param.slug);
  }
}
