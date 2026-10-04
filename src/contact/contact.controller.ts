import {
  Patch,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { ContactService, ContactCreateResult } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactLogsQueryDto } from './dto/contact-logs-query.dto';
import { UpdateContactLogDto } from './dto/update-contact-log.dto';
import { ContactFunnelQueryDto } from './dto/contact-funnel-query.dto';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly config: ConfigService,
  ) {}

  private checkAdminKey(req: Request): void {
    const adminKey = this.config.get<string>('CONTACT_ADMIN_KEY')?.trim();
    const provided = (req.headers['x-admin-key'] as string | undefined)?.trim();
    if (!adminKey) {
      throw new UnauthorizedException('Admin access is not configured');
    }
    if (provided !== adminKey) {
      throw new UnauthorizedException('Invalid or missing admin key');
    }
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(
    @Body() createContactDto: CreateContactDto,
    @Req() req: Request,
  ): Promise<ContactCreateResult> {
    const ipHeader = (req.headers['x-forwarded-for'] as string) ?? '';
    const ip =
      req.ip || ipHeader.split(',')[0].trim() || req.socket.remoteAddress || '';

    const userAgent = (req.headers['user-agent'] as string) ?? null;

    return this.contactService.create(createContactDto, {
      ip,
      userAgent,
    });
  }

  @Get('logs')
  async list(@Req() req: Request, @Query() query: ContactLogsQueryDto) {
    this.checkAdminKey(req);
    const pageNum = query.page ?? 1;
    const limitNum = query.limit ?? 20;
    return this.contactService.findAll({
      page: Number.isFinite(pageNum) ? pageNum : 1,
      limit: Number.isFinite(limitNum) ? limitNum : 20,
      q: query.q,
      status: query.status,
    });
  }

  @Get('summary')
  async summary(@Req() req: Request, @Query() query: ContactFunnelQueryDto) {
    this.checkAdminKey(req);
    return this.contactService.getSummary(query);
  }

  @Get('funnel-pages')
  async funnelPages(
    @Req() req: Request,
    @Query() query: ContactFunnelQueryDto,
  ) {
    this.checkAdminKey(req);
    return this.contactService.getFunnelPages(query);
  }

  @Patch('logs/:id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateContactLogDto,
  ) {
    this.checkAdminKey(req);
    return this.contactService.updateLog(id, dto);
  }

  @Get('export')
  async export(@Req() req: Request, @Res() res: Response): Promise<void> {
    this.checkAdminKey(req);
    const csv = await this.contactService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="mupi-contact-logs.csv"',
    );
    res.setHeader('Cache-Control', 'no-store');
    res.send(csv);
  }
}
