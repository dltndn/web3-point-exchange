import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { REDIS_KEY_PREFIX, REDIS_DEFAULT_TTL } from './constants';

/**
 * Redis service for caching operations
 */
@Injectable()
export class RedisService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  /**
   * Get Redis client instance
   */
  getClient(): Redis {
    return this.redis;
  }

  /**
   * Set a key-value pair with optional TTL
   */
  async set(
    key: string,
    value: string,
    ttl: number = REDIS_DEFAULT_TTL,
  ): Promise<string | null> {
    const prefixedKey = `${REDIS_KEY_PREFIX}${key}`;
    return await this.redis.setex(prefixedKey, ttl, value);
  }

  /**
   * Set a key-value pair with no TTL
   */
  async setWithoutTTL(key: string, value: string): Promise<string | null> {
    const prefixedKey = `${REDIS_KEY_PREFIX}${key}`;
    return await this.redis.set(prefixedKey, value);
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    const prefixedKey = `${REDIS_KEY_PREFIX}${key}`;
    return await this.redis.get(prefixedKey);
  }

  /**
   * Delete key
   */
  async del(key: string): Promise<number> {
    const prefixedKey = `${REDIS_KEY_PREFIX}${key}`;
    return await this.redis.del(prefixedKey);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<number> {
    const prefixedKey = `${REDIS_KEY_PREFIX}${key}`;
    return await this.redis.exists(prefixedKey);
  }

  /**
   * Set key expiration
   */
  async expire(key: string, seconds: number): Promise<number> {
    const prefixedKey = `${REDIS_KEY_PREFIX}${key}`;
    return await this.redis.expire(prefixedKey, seconds);
  }
}
