import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { AnalyticsEvent } from './analytics.entity';
import { TrackPageViewDto } from './dto/track-page-view.dto';
import { TrackEventDto } from './dto/track-event.dto';
import type {
  AnalyticsQueryDto,
  AnalyticsRange,
} from './dto/analytics-query.dto';

const SEARCH_SOURCES = [
  'baidu',
  'google',
  'bing',
  '360',
  'sogou',
  'shenma',
  'yahoo',
  'yandex',
] as const;

const CHINA_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

type RangeBounds = {
  start?: Date;
  end?: Date;
};

type TrendMetric = {
  previous: number;
  delta: number;
  deltaRate: number | null;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
  ) {}

  private getRefererHost(referer?: string | null): string {
    const value = (referer ?? '').trim();
    if (!value) return '';
    try {
      return new URL(value).hostname.toLowerCase();
    } catch {
      return value.toLowerCase();
    }
  }

  private normalizeSource(referer?: string | null): string {
    const host = this.getRefererHost(referer);
    if (!host) return 'direct';
    if (host.includes('baidu.')) return 'baidu';
    if (host.includes('google.')) return 'google';
    if (host.includes('bing.')) return 'bing';
    if (host.includes('so.com') || host.includes('360.cn')) return '360';
    if (host.includes('sogou.')) return 'sogou';
    if (host.includes('sm.cn')) return 'shenma';
    if (host.includes('yahoo.')) return 'yahoo';
    if (host.includes('yandex.')) return 'yandex';
    if (
      host.includes('weixin.qq.com') ||
      host.includes('mp.weixin.qq.com') ||
      host.includes('wechat')
    ) {
      return 'wechat';
    }
    if (host.includes('mupi.cn')) return 'internal';
    return 'referral';
  }

  private sourceCaseExpr(alias = 'e'): string {
    const ref = `LOWER(COALESCE(${alias}.referer, ''))`;
    return `
      CASE
        WHEN ${ref} = '' THEN 'direct'
        WHEN ${ref} LIKE '%baidu.%' THEN 'baidu'
        WHEN ${ref} LIKE '%google.%' THEN 'google'
        WHEN ${ref} LIKE '%bing.%' THEN 'bing'
        WHEN ${ref} LIKE '%so.com%' OR ${ref} LIKE '%360.cn%' THEN '360'
        WHEN ${ref} LIKE '%sogou.%' THEN 'sogou'
        WHEN ${ref} LIKE '%sm.cn%' THEN 'shenma'
        WHEN ${ref} LIKE '%yahoo.%' THEN 'yahoo'
        WHEN ${ref} LIKE '%yandex.%' THEN 'yandex'
        WHEN ${ref} LIKE '%weixin.qq.com%' OR ${ref} LIKE '%mp.weixin.qq.com%' OR ${ref} LIKE '%wechat%' THEN 'wechat'
        WHEN ${ref} LIKE '%mupi.cn%' THEN 'internal'
        ELSE 'referral'
      END
    `;
  }

  private getChinaDayStart(date: Date): Date {
    const shifted = new Date(date.getTime() + CHINA_TZ_OFFSET_MS);
    return new Date(
      Date.UTC(
        shifted.getUTCFullYear(),
        shifted.getUTCMonth(),
        shifted.getUTCDate(),
        -8,
        0,
        0,
        0,
      ),
    );
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private getDurationDays(range: AnalyticsRange = 'all'): number | null {
    switch (range) {
      case 'today':
      case 'yesterday':
        return 1;
      case '7d':
        return 7;
      case '30d':
        return 30;
      case 'all':
      default:
        return null;
    }
  }

  private getRangeBounds(range: AnalyticsRange = 'all'): RangeBounds {
    const todayStart = this.getChinaDayStart(new Date());
    switch (range) {
      case 'today':
        return { start: todayStart, end: this.addDays(todayStart, 1) };
      case 'yesterday':
        return { start: this.addDays(todayStart, -1), end: todayStart };
      case '7d':
        return {
          start: this.addDays(todayStart, -6),
          end: this.addDays(todayStart, 1),
        };
      case '30d':
        return {
          start: this.addDays(todayStart, -29),
          end: this.addDays(todayStart, 1),
        };
      case 'all':
      default:
        return {};
    }
  }

  private getRangeLabel(range: AnalyticsRange = 'all'): string {
    switch (range) {
      case 'today':
        return '今天';
      case 'yesterday':
        return '昨天';
      case '7d':
        return '近 7 天';
      case '30d':
        return '近 30 天';
      case 'all':
      default:
        return '全部时间';
    }
  }

  private getCompareLabel(range: AnalyticsRange = 'all'): string | null {
    switch (range) {
      case 'today':
        return '较昨天';
      case 'yesterday':
        return '较前一天';
      case '7d':
        return '较上一个 7 天';
      case '30d':
        return '较上一个 30 天';
      case 'all':
      default:
        return null;
    }
  }

  private getPreviousRangeBounds(range: AnalyticsRange = 'all'): RangeBounds {
    const current = this.getRangeBounds(range);
    const days = this.getDurationDays(range);
    if (!current.start || !current.end || !days) return {};
    return {
      start: this.addDays(current.start, -days),
      end: current.start,
    };
  }

  private applyBounds<T extends SelectQueryBuilder<AnalyticsEvent>>(
    qb: T,
    bounds: RangeBounds,
    alias = 'e',
  ): T {
    if (bounds.start) {
      qb.andWhere(`${alias}.createdAt >= :rangeStart`, {
        rangeStart: bounds.start.toISOString(),
      });
    }
    if (bounds.end) {
      qb.andWhere(`${alias}.createdAt < :rangeEnd`, {
        rangeEnd: bounds.end.toISOString(),
      });
    }
    return qb;
  }

  private applyFilters<T extends SelectQueryBuilder<AnalyticsEvent>>(
    qb: T,
    query?: AnalyticsQueryDto,
    alias = 'e',
  ): T {
    this.applyBounds(qb, this.getRangeBounds(query?.range ?? 'all'), alias);

    const sourceKind = query?.sourceKind ?? 'all';
    if (sourceKind === 'all') return qb;

    const sourceExpr = this.sourceCaseExpr(alias);
    if (sourceKind === 'search') {
      qb.andWhere(`${sourceExpr} IN (:...searchSources)`, {
        searchSources: [...SEARCH_SOURCES],
      });
      return qb;
    }

    if (sourceKind === 'referral') {
      qb.andWhere(`${sourceExpr} IN (:...referralSources)`, {
        referralSources: ['referral', 'internal'],
      });
      return qb;
    }

    qb.andWhere(`${sourceExpr} = :sourceKind`, { sourceKind });
    return qb;
  }

  private buildTrend(current: number, previous: number): TrendMetric {
    const delta = current - previous;
    return {
      previous,
      delta,
      deltaRate:
        previous > 0 ? Number(((delta / previous) * 100).toFixed(1)) : null,
    };
  }

  private getSearchKeyword(referer?: string | null): string {
    const value = (referer ?? '').trim();
    if (!value) return '';
    try {
      const url = new URL(value);
      const params = url.searchParams;
      const raw =
        params.get('wd') ||
        params.get('word') ||
        params.get('q') ||
        params.get('query') ||
        params.get('keyword') ||
        params.get('p') ||
        params.get('text') ||
        '';
      return raw.trim().slice(0, 80);
    } catch {
      return '';
    }
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

  async getOverview(query: AnalyticsQueryDto = {}) {
    const pvQb = this.applyFilters(
      this.analyticsRepo
        .createQueryBuilder('e')
        .where('e.eventType = :eventType', { eventType: 'page_view' }),
      query,
    );

    const previousBounds = this.getPreviousRangeBounds(query.range ?? 'all');
    const [
      pvRow,
      uvRow,
      ctaRow,
      wechatRow,
      phoneRow,
      formRow,
      prevPvRow,
      prevUvRow,
      prevCtaRow,
      prevFormRow,
    ] = await Promise.all([
      pvQb.clone().select('COUNT(1)', 'cnt').getRawOne<{ cnt: string }>(),
      pvQb
        .clone()
        .select('COUNT(DISTINCT e.visitorId)', 'uv')
        .getRawOne<{ uv: string }>(),
      this.countAction('cta_click', query),
      this.countAction('wechat_click', query),
      this.countAction('phone_click', query),
      this.countAction('form_submit', query),
      this.applyBounds(
        this.applyFilters(
          this.analyticsRepo
            .createQueryBuilder('e')
            .where('e.eventType = :eventType', { eventType: 'page_view' }),
          { ...query, range: 'all' },
        ),
        previousBounds,
      )
        .select('COUNT(1)', 'cnt')
        .getRawOne<{ cnt: string }>(),
      this.applyBounds(
        this.applyFilters(
          this.analyticsRepo
            .createQueryBuilder('e')
            .where('e.eventType = :eventType', { eventType: 'page_view' }),
          { ...query, range: 'all' },
        ),
        previousBounds,
      )
        .select('COUNT(DISTINCT e.visitorId)', 'uv')
        .getRawOne<{ uv: string }>(),
      this.countActionForBounds('cta_click', query, previousBounds),
      this.countActionForBounds('form_submit', query, previousBounds),
    ]);

    const prevPv = Number(prevPvRow?.cnt ?? 0);
    const prevUv = Number(prevUvRow?.uv ?? 0);
    const prevCta = Number(prevCtaRow ?? 0);
    const prevForm = Number(prevFormRow ?? 0);

    return {
      pv: Number(pvRow?.cnt ?? 0),
      uv: Number(uvRow?.uv ?? 0),
      periodLabel: this.getRangeLabel(query.range ?? 'all'),
      sourceKind: query.sourceKind ?? 'all',
      compareLabel: this.getCompareLabel(query.range ?? 'all'),
      ctaClicks: ctaRow,
      wechatClicks: wechatRow,
      phoneClicks: phoneRow,
      formSubmits: formRow,
      trends:
        query.range && query.range !== 'all'
          ? {
              pv: this.buildTrend(Number(pvRow?.cnt ?? 0), prevPv),
              uv: this.buildTrend(Number(uvRow?.uv ?? 0), prevUv),
              ctaClicks: this.buildTrend(ctaRow, prevCta),
              formSubmits: this.buildTrend(formRow, prevForm),
            }
          : null,
    };
  }

  private async countAction(
    action: string,
    query: AnalyticsQueryDto = {},
  ): Promise<number> {
    return this.countActionForBounds(
      action,
      query,
      this.getRangeBounds(query.range ?? 'all'),
    );
  }

  private async countActionForBounds(
    action: string,
    query: AnalyticsQueryDto,
    bounds: RangeBounds,
  ): Promise<number> {
    const qb = this.applyFilters(
      this.analyticsRepo
        .createQueryBuilder('e')
        .where('e.eventType = :eventType', { eventType: 'conversion' })
        .andWhere('e.action = :action', { action }),
      { ...query, range: 'all' },
    );
    this.applyBounds(qb, bounds);
    const row = await qb.select('COUNT(1)', 'cnt').getRawOne<{ cnt: string }>();
    return Number(row?.cnt ?? 0);
  }

  async getPages(query: AnalyticsQueryDto = {}) {
    const rows = await this.applyFilters(
      this.analyticsRepo
        .createQueryBuilder('e')
        .select('e.path', 'path')
        .addSelect('COUNT(1)', 'count')
        .where('e.eventType = :eventType', { eventType: 'page_view' }),
      query,
    )
      .groupBy('e.path')
      .orderBy('count', 'DESC')
      .limit(100)
      .getRawMany<{ path: string; count: string }>();

    return rows.map((row) => ({
      path: row.path,
      count: Number(row.count),
    }));
  }

  async getSources(query: AnalyticsQueryDto = {}) {
    const sourceExpr = this.sourceCaseExpr('e');
    const rows = await this.applyFilters(
      this.analyticsRepo
        .createQueryBuilder('e')
        .select(sourceExpr, 'source')
        .addSelect('COUNT(1)', 'count')
        .where('e.eventType = :eventType', { eventType: 'page_view' }),
      query,
    )
      .groupBy(sourceExpr)
      .orderBy('count', 'DESC')
      .getRawMany<{ source: string; count: string }>();

    return rows.map((row) => ({
      source: row.source,
      count: Number(row.count),
    }));
  }

  async getEvents(query: AnalyticsQueryDto = {}) {
    const rows = await this.applyFilters(
      this.analyticsRepo
        .createQueryBuilder('e')
        .select('e.action', 'action')
        .addSelect('COUNT(1)', 'count')
        .where('e.eventType = :eventType', { eventType: 'conversion' }),
      query,
    )
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

  async getConversionPages(query: AnalyticsQueryDto = {}) {
    const rows = await this.applyFilters(
      this.analyticsRepo
        .createQueryBuilder('e')
        .select('e.path', 'path')
        .addSelect('COUNT(1)', 'count')
        .where('e.eventType = :eventType', { eventType: 'conversion' }),
      query,
    )
      .groupBy('e.path')
      .orderBy('count', 'DESC')
      .limit(100)
      .getRawMany<{ path: string; count: string }>();

    return rows.map((row) => ({
      path: row.path,
      count: Number(row.count),
    }));
  }

  async getFunnelPages(query: AnalyticsQueryDto = {}) {
    const rows = await this.applyFilters(
      this.analyticsRepo
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
        ),
      query,
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

  async getAttribution(query: AnalyticsQueryDto = {}) {
    const firstRows = await this.applyFilters(
      this.analyticsRepo
        .createQueryBuilder('e')
        .select('e.visitorId', 'visitorId')
        .addSelect(this.sourceCaseExpr('e'), 'source')
        .where('e.eventType = :eventType', { eventType: 'page_view' })
        .distinctOn(['e.visitorId'])
        .orderBy('e.visitorId', 'ASC')
        .addOrderBy('e.createdAt', 'ASC')
        .addOrderBy('e.id', 'ASC'),
      query,
    ).getRawMany<{ visitorId: string; source: string }>();

    const lastRows = await this.applyFilters(
      this.analyticsRepo
        .createQueryBuilder('e')
        .select('e.visitorId', 'visitorId')
        .addSelect(this.sourceCaseExpr('e'), 'source')
        .where('e.eventType = :eventType', { eventType: 'page_view' })
        .distinctOn(['e.visitorId'])
        .orderBy('e.visitorId', 'ASC')
        .addOrderBy('e.createdAt', 'DESC')
        .addOrderBy('e.id', 'DESC'),
      query,
    ).getRawMany<{ visitorId: string; source: string }>();

    const aggregate = (rows: Array<{ source: string }>) => {
      const map = new Map<string, number>();
      rows.forEach((row) => {
        const key = row.source || 'unknown';
        map.set(key, (map.get(key) ?? 0) + 1);
      });
      return [...map.entries()]
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    };

    return {
      firstTouchSources: aggregate(firstRows),
      lastTouchSources: aggregate(lastRows),
    };
  }

  async getSearchKeywords(query: AnalyticsQueryDto = {}) {
    const refererRows = await this.applyFilters(
      this.analyticsRepo
        .createQueryBuilder('e')
        .select('e.referer', 'referer')
        .addSelect('COUNT(1)', 'count')
        .where('e.eventType = :eventType', { eventType: 'page_view' })
        .andWhere(`${this.sourceCaseExpr('e')} IN (:...searchSources)`, {
          searchSources: [...SEARCH_SOURCES],
        }),
      { ...query, sourceKind: 'all' },
    )
      .groupBy('e.referer')
      .getRawMany<{ referer: string; count: string }>();

    const keywordMap = new Map<
      string,
      { keyword: string; source: string; count: number }
    >();
    refererRows.forEach((row) => {
      const keyword = this.getSearchKeyword(row.referer);
      if (!keyword) return;
      const source = this.normalizeSource(row.referer);
      const key = `${source}::${keyword}`;
      const current = keywordMap.get(key);
      if (current) {
        current.count += Number(row.count ?? 0);
      } else {
        keywordMap.set(key, {
          keyword,
          source,
          count: Number(row.count ?? 0),
        });
      }
    });

    return [...keywordMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
}
