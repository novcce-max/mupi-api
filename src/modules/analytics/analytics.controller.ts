import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { AnalyticsService } from './analytics.service';
import { TrackPageViewDto } from './dto/track-page-view.dto';
import { TrackEventDto } from './dto/track-event.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly config: ConfigService,
  ) {}

  @Post('track')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  async track(
    @Body() dto: TrackPageViewDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.analyticsService.trackPageView(
      {
        ...dto,
        userAgent: dto.userAgent || userAgent || '',
      },
      ip,
    );
  }

  @Post('event')
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async event(
    @Body() dto: TrackEventDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.analyticsService.trackEvent(
      {
        ...dto,
        userAgent: dto.userAgent || userAgent || '',
      },
      ip,
    );
  }

  @Get('overview')
  async overview(@Req() req: Request) {
    this.assertAdminReadAccess(req);
    return this.analyticsService.getOverview();
  }

  @Get('pages')
  async pages(@Req() req: Request) {
    this.assertAdminReadAccess(req);
    return this.analyticsService.getPages();
  }

  @Get('sources')
  async sources(@Req() req: Request) {
    this.assertAdminReadAccess(req);
    return this.analyticsService.getSources();
  }

  @Get('events')
  async events(@Req() req: Request) {
    this.assertAdminReadAccess(req);
    return this.analyticsService.getEvents();
  }

  @Get('conversion-pages')
  async conversionPages(@Req() req: Request) {
    this.assertAdminReadAccess(req);
    return this.analyticsService.getConversionPages();
  }

  @Get('funnel-pages')
  async funnelPages(@Req() req: Request) {
    this.assertAdminReadAccess(req);
    return this.analyticsService.getFunnelPages();
  }

  private assertAdminReadAccess(req: Request): void {
    const adminUser = (
      req.headers['x-admin-user'] as string | undefined
    )?.trim();
    const providedSecret = (
      req.headers['x-internal-secret'] as string | undefined
    )?.trim();
    const internalTokensRaw =
      this.config.get<string>('INTERNAL_RPC_TOKENS')?.trim() ?? '';
    const singleToken =
      this.config.get<string>('INTERNAL_RPC_TOKEN')?.trim() ?? '';

    const allowedSecrets = new Set<string>();
    if (internalTokensRaw) {
      internalTokensRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => allowedSecrets.add(t));
    }
    if (singleToken) {
      allowedSecrets.add(singleToken);
    }

    if (!adminUser || !providedSecret || !allowedSecrets.has(providedSecret)) {
      throw new UnauthorizedException(
        'Analytics read requires internal admin auth',
      );
    }
  }
}
