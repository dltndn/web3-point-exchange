import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { PointToTokenTransaction } from './entities/point-to-token-transaction.entity';
import { TokenToPointTransaction } from './entities/token-to-point-transaction.entity';
import { PointToTokenTransactionRepository } from './repositories/point-to-token-transaction.repository';
import { TokenToPointTransactionRepository } from './repositories/token-to-point-transaction.repository';
import { SwapModule } from '../swap/swap.module';
import { PointModule } from '../point/point.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PointToTokenTransaction,
      TokenToPointTransaction,
    ]),
    forwardRef(() => SwapModule),
    forwardRef(() => PointModule),
    forwardRef(() => RabbitmqModule),
  ],
  controllers: [TokenController],
  providers: [
    TokenService,
    PointToTokenTransactionRepository,
    TokenToPointTransactionRepository,
  ],
  exports: [TokenService],
})
export class TokenModule {}
