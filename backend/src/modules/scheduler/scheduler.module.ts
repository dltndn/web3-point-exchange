import { Module } from '@nestjs/common';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { RedlockModule } from '../redlock/redlock.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { SwapModule } from '../swap/swap.module';

@Module({
  imports: [RabbitmqModule, RedlockModule, BlockchainModule, SwapModule],
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
