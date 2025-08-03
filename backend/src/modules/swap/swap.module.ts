import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { UserSwapHistory } from './entities/user-swap-history.entity';
import { UserSwapHistoryRepository } from './repositories/user-swap-history.repository';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSwapHistory]),
    forwardRef(() => TokenModule),
  ],
  controllers: [SwapController],
  providers: [SwapService, UserSwapHistoryRepository],
  exports: [SwapService, UserSwapHistoryRepository],
})
export class SwapModule {}
