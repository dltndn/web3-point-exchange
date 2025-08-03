import { Module } from '@nestjs/common';
import { RedisModule as IORedisModule } from '@nestjs-modules/ioredis';
import { Config } from '../../config/environment/config';
import { RedisService } from './redis.service';

@Module({
  imports: [
    IORedisModule.forRoot({
      type: 'single',
      url: `redis://${Config.getEnvironment().REDIS.HOST}:${
        Config.getEnvironment().REDIS.PORT
      }`,
    }),
  ],
  providers: [RedisService],
  exports: [RedisService, IORedisModule],
})
export class RedisModule {}
