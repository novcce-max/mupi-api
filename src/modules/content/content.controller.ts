import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { IdParamDto } from '../../common/dto/id-param.dto';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('content')
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('status') status?: 'draft' | 'published' | 'all',
  ) {
    return this.service.list({ q, status: status ?? 'published' });
  }

  @Get(':id')
  async findOne(@Param() param: IdParamDto) {
    return this.service.findOne(Number(param.id));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateContentDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param() param: IdParamDto, @Body() dto: UpdateContentDto) {
    return this.service.update(Number(param.id), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param() param: IdParamDto) {
    return this.service.remove(Number(param.id));
  }
}
