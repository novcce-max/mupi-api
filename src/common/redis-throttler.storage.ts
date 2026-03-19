import type { ThrottlerStorage } from '@nestjs/throttler';
import type { Redis } from 'ioredis';

/**
 * 简单的 Redis 限流存储实现：
 * - 每个 key 维护一个计数器，ttl 由 ThrottlerModule 传入
 * - 仅依赖 INCR / EXPIRE，支持多实例共享限流配额
 */
export class RedisThrottlerStorageService implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<any> {
    try {
      const ttlSeconds = Math.max(1, Math.ceil(ttl / 1000));
      const exists = await this.redis.exists(key);
      let totalHits: number;

      if (!exists) {
        await this.redis.set(key, '1', 'EX', ttlSeconds);
        totalHits = 1;
      } else {
        totalHits = await this.redis.incr(key);
      }

      let timeToExpire = await this.redis.pttl(key);
      if (timeToExpire < 0) {
        await this.redis.pexpire(key, ttl);
        timeToExpire = ttl;
      }

      const isBlocked = totalHits > limit;
      const timeToBlockExpire = isBlocked ? blockDuration : 0;

      return {
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      };
    } catch {
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
