import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { UserPoint } from './entities/user-point.entity';
import { ConsumptionHistory } from './entities/consumption-history.entity';
import { GrantHistory } from './entities/grant-history.entity';
import { UserSwapHistory } from '../swap/entities/user-swap-history.entity';
import { User } from './entities/user.entity';
import { UserPointRepository } from './repositories/user-point.repository';
import { ConsumptionHistoryRepository } from './repositories/consumption-history.repository';
import { GrantHistoryRepository } from './repositories/grant-history.repository';
import { UserSwapHistoryRepository } from '../swap/repositories/user-swap-history.repository';
import { UserRepository } from './repositories/user.repository';
import { RedisModule } from '../redis/redis.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { RedlockModule } from '../redlock/redlock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPoint,
      ConsumptionHistory,
      GrantHistory,
      UserSwapHistory,
      User,
    ]),
    RedisModule,
    RedlockModule,
    RabbitmqModule,
    BlockchainModule,
  ],
  controllers: [PointController],
  providers: [
    PointService,
    UserPointRepository,
    ConsumptionHistoryRepository,
    GrantHistoryRepository,
    UserSwapHistoryRepository,
    UserRepository,
  ],
  exports: [
    PointService,
    UserRepository,
    UserPointRepository,
    UserSwapHistoryRepository,
  ],
})
export class PointModule {}
