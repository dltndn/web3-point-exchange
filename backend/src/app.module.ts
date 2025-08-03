import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PointModule } from './modules/point/point.module';
import { SwapModule } from './modules/swap/swap.module';
import { TokenModule } from './modules/token/token.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { RabbitmqModule } from './modules/rabbitmq/rabbitmq.module';
import { RedisModule } from './modules/redis/redis.module';
import { RedlockModule } from './modules/redlock/redlock.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Config } from './config/environment/config';

@Module({
  imports: [
    TypeOrmModule.forRoot(Config.getEnvironment().DATABASE),
    ScheduleModule.forRoot(),
    RabbitmqModule,
    RedisModule,
    RedlockModule,
    PointModule,
    SwapModule,
    TokenModule,
    BlockchainModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
