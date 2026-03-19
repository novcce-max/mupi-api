import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AnalyticsEvent } from './analytics.entity';
import { TrackPageViewDto } from './dto/track-page-view.dto';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
  ) {}

  private normalizeSource(referer?: string | null): string {
    const value = (referer ?? '').toLowerCase().trim();
    if (!value) return 'direct';
    if (value.includes('baidu')) return 'baidu';
    if (value.includes('google')) return 'google';
    if (value.includes('bing')) return 'bing';
    if (value.includes('wechat')) return 'wechat';
    return 'other';
  }

  async trackPageView(
    dto: TrackPageViewDto,
    ip: string,
  ): Promise<{ success: true }> {
    const event = this.analyticsRepo.create({
      visitorId: dto.visitorId,
      path: dto.path || '/',
      referer: dto.referer ?? '',
      source: this.normalizeSource(dto.referer),
      userAgent: dto.userAgent ?? '',
      ip,
      eventType: 'page_view',
      action: null,
      label: null,
      meta: null,
    });
    await this.analyticsRepo.save(event);
    return { success: true };
  }

  async trackEvent(dto: TrackEventDto, ip: string): Promise<{ success: true }> {
    const event = this.analyticsRepo.create({
      visitorId: dto.visitorId,
      path: dto.path || '/',
      referer: dto.referer ?? '',
      source: this.normalizeSource(dto.referer),
      userAgent: dto.userAgent ?? '',
      ip,
      eventType: 'conversion',
      action: dto.action,
      label: dto.label ?? null,
      meta: dto.meta ?? null,
    });
    await this.analyticsRepo.save(event);
    return { success: true };
  }

  async getOverview() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const pvQb = this.analyticsRepo
      .createQueryBuilder('e')
      .where('e.eventType = :eventType', { eventType: 'page_view' });

    const [pvRow, uvRow, todayPvRow, ctaRow, wechatRow, phoneRow, formRow] =
      await Promise.all([
        pvQb.clone().select('COUNT(1)', 'cnt').getRawOne<{ cnt: string }>(),
        pvQb
          .clone()
          .select('COUNT(DISTINCT e.visitorId)', 'uv')
          .getRawOne<{ uv: string }>(),
        pvQb
          .clone()
          .andWhere('e.createdAt >= :todayStart', {
            todayStart: todayStart.toISOString(),
          })
          .select('COUNT(1)', 'cnt')
          .getRawOne<{ cnt: string }>(),
        this.countAction('cta_click'),
        this.countAction('wechat_click'),
        this.countAction('phone_click'),
        this.countAction('form_submit'),
      ]);

    return {
      pv: Number(pvRow?.cnt ?? 0),
      uv: Number(uvRow?.uv ?? 0),
      todayPv: Number(todayPvRow?.cnt ?? 0),
      ctaClicks: ctaRow,
      wechatClicks: wechatRow,
      phoneClicks: phoneRow,
      formSubmits: formRow,
    };
  }

  private async countAction(action: string): Promise<number> {
    const row = await this.analyticsRepo
      .createQueryBuilder('e')
      .where('e.eventType = :eventType', { eventType: 'conversion' })
      .andWhere('e.action = :action', { action })
      .select('COUNT(1)', 'cnt')
      .getRawOne<{ cnt: string }>();
    return Number(row?.cnt ?? 0);
  }

  async getPages() {
    const rows = await this.analyticsRepo
      .createQueryBuilder('e')
      .select('e.path', 'path')
      .addSelect('COUNT(1)', 'count')
      .where('e.eventType = :eventType', { eventType: 'page_view' })
      .groupBy('e.path')
      .orderBy('count', 'DESC')
      .limit(100)
      .getRawMany<{ path: string; count: string }>();

    return rows.map((row) => ({
      path: row.path,
      count: Number(row.count),
    }));
  }

  async getSources() {
    const rows = await this.analyticsRepo
      .createQueryBuilder('e')
      .select('e.source', 'source')
      .addSelect('COUNT(1)', 'count')
      .where('e.eventType = :eventType', { eventType: 'page_view' })
      .groupBy('e.source')
      .orderBy('count', 'DESC')
      .getRawMany<{ source: string; count: string }>();

    return rows.map((row) => ({
      source: row.source,
      count: Number(row.count),
    }));
  }

  async getEvents() {
    const rows = await this.analyticsRepo
      .createQueryBuilder('e')
      .select('e.action', 'action')
      .addSelect('COUNT(1)', 'count')
      .where('e.eventType = :eventType', { eventType: 'conversion' })
      .groupBy('e.action')
      .orderBy('count', 'DESC')
      .getRawMany<{ action: string | null; count: string }>();

    return rows
      .filter((row) => !!row.action)
      .map((row) => ({
        action: row.action as string,
        count: Number(row.count),
      }));
  }

  async getConversionPages() {
    const rows = await this.analyticsRepo
      .createQueryBuilder('e')
      .select('e.path', 'path')
      .addSelect('COUNT(1)', 'count')
      .where('e.eventType = :eventType', { eventType: 'conversion' })
      .groupBy('e.path')
      .orderBy('count', 'DESC')
      .limit(100)
      .getRawMany<{ path: string; count: string }>();

    return rows.map((row) => ({
      path: row.path,
      count: Number(row.count),
    }));
  }

  async getFunnelPages() {
    const rows = await this.analyticsRepo
      .createQueryBuilder('e')
      .select('e.path', 'path')
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'page_view' THEN 1 ELSE 0 END)`,
        'pv',
      )
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'conversion' AND e.action = 'cta_click' THEN 1 ELSE 0 END)`,
        'ctaClicks',
      )
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'conversion' AND e.action = 'form_submit' THEN 1 ELSE 0 END)`,
        'formSubmits',
      )
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'conversion' AND e.action = 'wechat_click' THEN 1 ELSE 0 END)`,
        'wechatClicks',
      )
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'conversion' AND e.action = 'phone_click' THEN 1 ELSE 0 END)`,
        'phoneClicks',
      )
      .groupBy('e.path')
      .orderBy('pv', 'DESC')
      .getRawMany<{
        path: string;
        pv: string;
        ctaClicks: string;
        formSubmits: string;
        wechatClicks: string;
        phoneClicks: string;
      }>();

    return rows.map((row) => ({
      path: row.path || '/',
      pv: Number(row.pv ?? 0),
      ctaClicks: Number(row.ctaClicks ?? 0),
      formSubmits: Number(row.formSubmits ?? 0),
      wechatClicks: Number(row.wechatClicks ?? 0),
      phoneClicks: Number(row.phoneClicks ?? 0),
    }));
  }
}
