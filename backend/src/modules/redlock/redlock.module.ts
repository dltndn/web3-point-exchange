import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { RedlockService } from './redlock.service';

@Module({
  imports: [RedisModule],
  providers: [RedlockService],
  exports: [RedlockService],
})
export class RedlockModule {}
