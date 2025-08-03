import { Injectable, NotFoundException } from '@nestjs/common';
import {
  GetUserSwapHistoriesReqQueryDto,
  UserSwapHistoryResDto,
  UserSwapHistoryListResDto,
} from './dto/user-swap-history.dto';
import { UserSwapHistoryRepository } from './repositories/user-swap-history.repository';
import { UserSwapHistory } from './entities/user-swap-history.entity';
import { SwapStatus, SwapType } from './constants';
import { DataSource, EntityManager } from 'typeorm';
import { TokenService } from '../token/token.service';
import { TokenStatus } from '../token/constants';

@Injectable()
export class SwapService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userSwapHistoryRepository: UserSwapHistoryRepository,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * 사용자 교환 내역 조회
   */
  async getUserSwapHistories(
    query: GetUserSwapHistoriesReqQueryDto,
  ): Promise<UserSwapHistoryListResDto> {
    const { data, total } =
      await this.userSwapHistoryRepository.getWithPagination(query);

    return {
      count: total,
      data: data.map((entity) => this.mapUserSwapHistory(entity)),
    };
  }

  /**
   * 사용자 교환 내역 상세 조회
   */
  async getUserSwapHistory(
    userSwapHistoryId: string,
  ): Promise<UserSwapHistoryResDto> {
    const swapHistory =
      await this.userSwapHistoryRepository.findById(userSwapHistoryId);

    if (!swapHistory) {
      throw new NotFoundException('Swap history not found');
    }

    return this.mapUserSwapHistory(swapHistory);
  }

  async updateSwapHistoryById(
    userSwapHistoryId: string,
    data: Partial<UserSwapHistory>,
    entityManager?: EntityManager,
  ): Promise<UserSwapHistoryResDto | null> {
    const swapHistory = await this.userSwapHistoryRepository.update(
      userSwapHistoryId,
      data,
      entityManager,
    );

    if (!swapHistory) {
      throw new NotFoundException('Swap history not found');
    }

    return swapHistory ? this.mapUserSwapHistory(swapHistory) : null;
  }

  async updateSwapHistoryStatus(
    userSwapHistoryId: string,
    status: SwapStatus,
  ): Promise<void> {
    await this.userSwapHistoryRepository.updateStatus(
      userSwapHistoryId,
      status,
    );
  }

  async updateSwapHistoryStatusByTokenMintHistoryIds(
    tokenMintHistoryIds: number[],
    status: SwapStatus,
    entityManager?: EntityManager,
  ): Promise<void> {
    if (tokenMintHistoryIds.length === 0) return;

    const swapHistories =
      await this.userSwapHistoryRepository.getWithPagination({
        limit: 1000, // Adjust limit as needed
      });

    const filteredHistories = swapHistories.data.filter((history) =>
      tokenMintHistoryIds.includes(history.token_mint_history_id ?? 0),
    );

    for (const history of filteredHistories) {
      await this.userSwapHistoryRepository.updateStatus(
        history.user_swap_history_id,
        status,
        entityManager,
      );
    }
  }

  async updateSwapHistoryStatusByTokenBurnHistoryIds(
    tokenBurnHistoryIds: number[],
    status: SwapStatus,
    entityManager?: EntityManager,
  ): Promise<void> {
    if (tokenBurnHistoryIds.length === 0) return;

    const swapHistories =
      await this.userSwapHistoryRepository.getWithPagination({
        limit: 1000, // Adjust limit as needed
      });

    const filteredHistories = swapHistories.data.filter((history) =>
      tokenBurnHistoryIds.includes(history.token_burn_history_id ?? 0),
    );

    for (const history of filteredHistories) {
      await this.userSwapHistoryRepository.updateStatus(
        history.user_swap_history_id,
        status,
        entityManager,
      );
    }
  }

  async processSwapHistoryTransactions(
    transactionHash: string,
    datas: {
      userSwapHistoryId: string;
      type: SwapType;
    }[],
  ): Promise<void> {
    await this.dataSource.transaction(async (entityManager) => {
      for (const data of datas) {
        const swapHistory = await this.userSwapHistoryRepository.findById(
          data.userSwapHistoryId,
        );

        if (!swapHistory) {
          continue;
        }

        if (swapHistory.status !== SwapStatus.PENDING) {
          continue;
        }

        if (data.type === SwapType.POINT_TO_TOKEN) {
          const pointToTokenTransaction =
            await this.tokenService.createPointToTokenTransactions(
              {
                transactionHash,
                status: TokenStatus.PROCESSED,
                tokenAmount: swapHistory.amount_token.toString(),
              },
              entityManager,
            );

          await this.userSwapHistoryRepository.update(
            swapHistory.user_swap_history_id,
            {
              token_mint_history_id:
                pointToTokenTransaction.point_to_token_transaction_id,
            },
            entityManager,
          );
        } else if (data.type === SwapType.TOKEN_TO_POINT) {
          const tokenToPointTransaction =
            await this.tokenService.createTokenToPointTransactions(
              {
                transactionHash,
                status: TokenStatus.PROCESSED,
                tokenAmount: swapHistory.amount_point.toString(),
              },
              entityManager,
            );

          await this.userSwapHistoryRepository.update(
            swapHistory.user_swap_history_id,
            {
              token_burn_history_id:
                tokenToPointTransaction.token_to_point_transaction_id,
            },
            entityManager,
          );
        }
      }
    });
  }

  /**
   * 사용자 교환 내역 생성
   */
  async createUserSwapHistory(
    userId: string,
    type: SwapType,
    amountPoint: bigint,
    amountToken: bigint,
    status: SwapStatus = SwapStatus.PENDING,
    entityManager?: EntityManager,
  ): Promise<UserSwapHistory> {
    return await this.userSwapHistoryRepository.create(
      userId,
      type,
      amountPoint,
      amountToken,
      status,
      entityManager,
    );
  }

  private mapUserSwapHistory(entity: UserSwapHistory): UserSwapHistoryResDto {
    return {
      user_swap_history_id: entity.user_swap_history_id,
      user_id: entity.user_id,
      type: entity.type,
      amount_point: entity.amount_point.toString(),
      amount_token: entity.amount_token.toString(),
      status: entity.status,
      point_to_token_transaction_id:
        entity.point_to_token_transaction?.point_to_token_transaction_id,
      token_to_point_transaction_id:
        entity.token_to_point_transaction?.token_to_point_transaction_id,
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
    };
  }
}
