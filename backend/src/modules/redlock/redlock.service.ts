import { Injectable } from '@nestjs/common';
import Redlock, { type Lock } from 'redlock';
import { RedisService } from '../redis/redis.service';
import { HANDLE_POINT_LOCK, HANDLE_POINT_LOCK_EXPIRE_TIME } from './constants';

export interface LockOptions {
  retryCount?: number;
  retryDelay?: number;
  retryJitter?: number;
  automaticExtensionThreshold?: number;
}

/**
 * Redlock service for distributed locking operations
 */
@Injectable()
export class RedlockService {
  private readonly redlock: Redlock;

  constructor(private readonly redisService: RedisService) {
    this.redlock = new Redlock([redisService.getClient()], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
      automaticExtensionThreshold: 500,
    });
  }

  /**
   * Acquire a distributed lock
   */
  async acquireLock(
    resource: string,
    ttl: number,
    options?: LockOptions,
  ): Promise<Lock> {
    return await this.redlock.acquire([resource], ttl, options);
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(lock: Lock): Promise<void> {
    await lock.release();
  }

  /**
   * Execute function with distributed lock
   */
  async executeWithLock<T>(
    resource: string,
    ttl: number,
    fn: () => Promise<T>,
    options?: LockOptions,
  ): Promise<T> {
    const lock = await this.acquireLock(resource, ttl, options);
    try {
      return await fn();
    } finally {
      await this.releaseLock(lock);
    }
  }
}
