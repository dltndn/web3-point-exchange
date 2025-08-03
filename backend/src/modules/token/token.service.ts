import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  GetPointToTokenTransactionsReqQueryDto,
  PointToTokenTransactionListResDto,
  PointToTokenTransactionResDto,
  SuccessResDto,
  ProcessPointToTokenTransactionReqBodyDto,
  CreatePointToTokenTransactionsDataDto,
} from './dto/point-to-token-transaction.dto';
import {
  CreateTokenToPointTransactionsDataDto,
  GetTokenToPointTransactionsReqQueryDto,
  ProcessTokenToPointTransactionReqBodyDto,
  TokenToPointTransactionListResDto,
  TokenToPointTransactionResDto,
} from './dto/token-to-point-transaction.dto';
import { PointToTokenTransaction } from './entities/point-to-token-transaction.entity';
import { TokenToPointTransaction } from './entities/token-to-point-transaction.entity';
import { PointToTokenTransactionRepository } from './repositories/point-to-token-transaction.repository';
import { TokenToPointTransactionRepository } from './repositories/token-to-point-transaction.repository';
import { DataSource, EntityManager } from 'typeorm';
import { TokenStatus } from './constants';
import { SwapService } from '../swap/swap.service';
import { SwapStatus, SwapType } from '../swap/constants';
import { PointService } from '../point/point.service';
import { UpdateUserPointBalanceType } from '../rabbitmq/constants';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pointToTokenTxRepository: PointToTokenTransactionRepository,
    private readonly tokenToPointTxRepository: TokenToPointTransactionRepository,
    @Inject(forwardRef(() => SwapService))
    private readonly swapService: SwapService,
    @Inject(forwardRef(() => PointService))
    private readonly pointService: PointService,
    @Inject(forwardRef(() => RabbitmqService))
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async getPointToTokenTransactions(
    query: GetPointToTokenTransactionsReqQueryDto,
  ): Promise<PointToTokenTransactionListResDto> {
    const { data, total } =
      await this.pointToTokenTxRepository.getWithPagination(query);
    return {
      count: total,
      data: data.map((entity) => this.mapPointToTokenTx(entity)),
    };
  }

  async getPointToTokenTransaction(
    pointToTokenTransactionId: number,
  ): Promise<PointToTokenTransactionResDto> {
    const entity = await this.pointToTokenTxRepository.findById(
      pointToTokenTransactionId,
    );
    if (!entity) {
      throw new NotFoundException('Point to Token Transaction not found');
    }
    return this.mapPointToTokenTx(entity);
  }

  async processPointToTokenTransaction(
    body: ProcessPointToTokenTransactionReqBodyDto,
  ): Promise<SuccessResDto> {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const pointToTokenTransactions =
          await this.pointToTokenTxRepository.findByTransactionHash(
            body.transaction_hash,
          );

        if (pointToTokenTransactions.length === 0) {
          return {
            success: false,
            message:
              'No Point to Token Transactions found for the given transaction hash',
          };
        }

        const transactionIds = pointToTokenTransactions.map(
          (tx) => tx.point_to_token_transaction_id,
        );
        await this.pointToTokenTxRepository.updateStatusByIds(
          transactionIds,
          TokenStatus.CONFIRMED,
          entityManager,
        );

        await this.swapService.updateSwapHistoryStatusByTokenMintHistoryIds(
          transactionIds,
          SwapStatus.COMPLETED,
          entityManager,
        );

        return {
          success: true,
          message: 'Point to Token Transaction processed successfully',
        };
      });
    } catch (error) {
      // TO-DO: depositPoint 처리 에러 후속 처리 플로우 진행 코드 추가
      console.error('Point to Token Transaction processed failed', error);
      return {
        success: false,
        message: 'Point to Token Transaction processed failed',
      };
    }
  }

  async createPointToTokenTransactions(
    data: CreatePointToTokenTransactionsDataDto,
    entityManager?: EntityManager,
  ): Promise<PointToTokenTransactionResDto> {
    const pointToTokenTransaction = await this.pointToTokenTxRepository.create(
      data,
      entityManager,
    );
    return this.mapPointToTokenTx(pointToTokenTransaction);
  }

  async getTokenToPointTransactions(
    query: GetTokenToPointTransactionsReqQueryDto,
  ): Promise<TokenToPointTransactionListResDto> {
    const { data, total } =
      await this.tokenToPointTxRepository.getWithPagination(query);
    return {
      count: total,
      data: data.map((entity) => this.mapTokenToPointTx(entity)),
    };
  }

  async getTokenToPointTransaction(
    tokenToPointTransactionId: number,
  ): Promise<TokenToPointTransactionResDto> {
    const entity = await this.tokenToPointTxRepository.findById(
      tokenToPointTransactionId,
    );
    if (!entity) {
      throw new NotFoundException('Token to Point Transaction not found');
    }
    return this.mapTokenToPointTx(entity);
  }

  async processTokenToPointTransaction(
    body: ProcessTokenToPointTransactionReqBodyDto,
  ): Promise<SuccessResDto> {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const tokenToPointTransactions =
          await this.tokenToPointTxRepository.findByTransactionHash(
            body.transaction_hash,
          );

        const userPointIncreasePromises: { userId: string; amount: bigint }[] =
          [];

        if (tokenToPointTransactions.length === 0) {
          // 사용자가 서버를 통하지 않고 블록체인에 트랜잭션을 보낸 상황

          // event_logs 순회
          for (const eventLog of body.event_logs) {
            // eventLog.wallet_address 로 사용자 조회 - PointService 사용
            const user = await this.pointService.findUserByWalletAddress(
              eventLog.wallet_address,
            );

            if (!user) {
              // user 서버에 내용 전달 (현재는 로그만 출력)
              console.warn(
                `User not found for wallet address: ${eventLog.wallet_address}`,
              );
              continue;
            }

            // user_swap_history 생성 - SwapService 사용
            // status는 SwapStatus.COMPLETED
            const userSwapHistory =
              await this.swapService.createUserSwapHistory(
                user.user_id,
                SwapType.TOKEN_TO_POINT,
                BigInt(eventLog.point_amount),
                BigInt(eventLog.token_amount),
                SwapStatus.COMPLETED,
                entityManager,
              );

            // token_to_point_transaction 생성
            const tokenToPointTransaction =
              await this.createTokenToPointTransactions(
                {
                  transactionHash: body.transaction_hash,
                  status: TokenStatus.CONFIRMED,
                  tokenAmount: eventLog.token_amount,
                },
                entityManager,
              );

            // user_swap_history와 token_to_point_transaction 연결
            await this.swapService.updateSwapHistoryById(
              userSwapHistory.user_swap_history_id,
              {
                token_burn_history_id:
                  tokenToPointTransaction.token_to_point_transaction_id,
              },
              entityManager,
            );

            userPointIncreasePromises.push({
              userId: user.user_id,
              amount: BigInt(eventLog.point_amount),
            });
          }

          // user_point의 point 증가 처리 MQ 전송 - Promise.all 사용
          if (userPointIncreasePromises.length > 0) {
            await Promise.all(
              userPointIncreasePromises.map((promise) =>
                this.sendUserPointIncreaseMessage(
                  promise.userId,
                  promise.amount,
                ),
              ),
            );
          }

          return {
            success: true,
            message: 'Token to Point Transaction processed successfully',
          };
        }

        for (const eventLog of body.event_logs) {
          const user = await this.pointService.findUserByWalletAddress(
            eventLog.wallet_address,
          );
          if (!user) {
            // user 서버에 내용 전달 (현재는 로그만 출력)
            console.warn(
              `User not found for wallet address: ${eventLog.wallet_address}`,
            );
            continue;
          }

          userPointIncreasePromises.push({
            userId: user.user_id,
            amount: BigInt(eventLog.point_amount),
          });
        }

        const transactionIds = tokenToPointTransactions.map(
          (tx) => tx.token_to_point_transaction_id,
        );
        await this.tokenToPointTxRepository.updateStatusByIds(
          transactionIds,
          TokenStatus.CONFIRMED,
          entityManager,
        );

        await this.swapService.updateSwapHistoryStatusByTokenBurnHistoryIds(
          transactionIds,
          SwapStatus.COMPLETED,
          entityManager,
        );

        // user_point의 point 증가 처리 MQ 전송 - Promise.all 사용
        if (userPointIncreasePromises.length > 0) {
          await Promise.all(
            userPointIncreasePromises.map((promise) =>
              this.sendUserPointIncreaseMessage(promise.userId, promise.amount),
            ),
          );
        }

        return {
          success: true,
          message: 'Token to Point Transaction processed successfully',
        };
      });
    } catch (error) {
      // TO-DO: withdrawPoint 처리 에러 후속 처리 플로우 진행 코드 추가
      console.error('Token to Point Transaction processed failed', error);
      return {
        success: false,
        message: 'Token to Point Transaction processed failed',
      };
    }
  }

  sendUserPointIncreaseMessage(userId: string, amount: bigint): void {
    try {
      const message = {
        userId,
        amount: amount.toString(),
        type: UpdateUserPointBalanceType.INCREASE,
      };
      this.rabbitmqService.sendPointUpdateBalance(message);
    } catch (error) {
      // TO-DO: user_point의 point 증가 처리 MQ 전송 에러 후속 처리 플로우 진행 코드 추가
      console.error('User Point Increase Message sent failed', error);
    }
  }

  async createTokenToPointTransactions(
    data: CreateTokenToPointTransactionsDataDto,
    entityManager?: EntityManager,
  ): Promise<TokenToPointTransactionResDto> {
    const tokenToPointTransaction = await this.tokenToPointTxRepository.create(
      data,
      entityManager,
    );
    return this.mapTokenToPointTx(tokenToPointTransaction);
  }

  private mapPointToTokenTx(
    entity: PointToTokenTransaction,
  ): PointToTokenTransactionResDto {
    return {
      point_to_token_transaction_id: entity.point_to_token_transaction_id,
      transaction_hash: entity.transaction_hash ?? '',
      status: entity.status,
      amount: entity.amount.toString(),
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
    };
  }

  private mapTokenToPointTx(
    entity: TokenToPointTransaction,
  ): TokenToPointTransactionResDto {
    return {
      token_to_point_transaction_id: entity.token_to_point_transaction_id,
      transaction_hash: entity.transaction_hash ?? '',
      status: entity.status,
      amount: entity.amount.toString(),
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
    };
  }
}
