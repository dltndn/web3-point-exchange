import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { UserSwapHistory } from '../entities/user-swap-history.entity';
import { GetUserSwapHistoriesReqQueryDto } from '../dto/user-swap-history.dto';
import { SwapType, SwapStatus } from '../constants';

/**
 * Repository for UserSwapHistory entity
 */
@Injectable()
export class UserSwapHistoryRepository {
  constructor(
    @InjectRepository(UserSwapHistory)
    private readonly userSwapHistoryRepo: Repository<UserSwapHistory>,
  ) {}

  async findById(id: string): Promise<UserSwapHistory | null> {
    return await this.userSwapHistoryRepo.findOne({
      where: { user_swap_history_id: id },
      relations: ['point_to_token_transaction', 'token_to_point_transaction'],
    });
  }

  async create(
    userId: string,
    type: SwapType,
    amountPoint: bigint,
    amountToken: bigint,
    status: SwapStatus = SwapStatus.PENDING,
    entityManager?: EntityManager,
  ): Promise<UserSwapHistory> {
    const swapHistory = {
      user_id: userId,
      type,
      amount_point: amountPoint,
      amount_token: amountToken,
      status,
    };

    if (entityManager) {
      const userSwapHistory = entityManager.create(
        UserSwapHistory,
        swapHistory,
      );
      return await entityManager.save(userSwapHistory);
    }

    const userSwapHistory = this.userSwapHistoryRepo.create(swapHistory);
    return await this.userSwapHistoryRepo.save(userSwapHistory);
  }

  async getWithPagination({
    userId,
    type,
    status,
    lastId,
    limit = 10,
    offset = 0,
    order = 'DESC',
  }: GetUserSwapHistoriesReqQueryDto): Promise<{
    data: UserSwapHistory[];
    total: number;
  }> {
    const queryBuilder = this.userSwapHistoryRepo.createQueryBuilder('ush');

    queryBuilder
      .leftJoinAndSelect('ush.point_to_token_transaction', 'pttt')
      .leftJoinAndSelect('ush.token_to_point_transaction', 'ttpt');

    if (userId) {
      queryBuilder.andWhere('ush.user_id = :userId', { userId });
    }

    if (type) {
      queryBuilder.andWhere('ush.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('ush.status = :status', { status });
    }

    if (lastId) {
      const op = order === 'ASC' ? '>' : '<';
      queryBuilder.andWhere(`ush.user_swap_history_id ${op} :lastId`, {
        lastId,
      });
    }

    queryBuilder.orderBy('ush.created_at', order as 'ASC' | 'DESC');
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async update(
    userSwapHistoryId: string,
    data: Partial<UserSwapHistory>,
    entityManager?: EntityManager,
  ): Promise<UserSwapHistory | null> {
    const userSwapHistory = await this.findById(userSwapHistoryId);
    if (!userSwapHistory) {
      return null;
    }

    if (entityManager) {
      return await entityManager.save(Object.assign(userSwapHistory, data));
    }

    return await this.userSwapHistoryRepo.save(
      Object.assign(userSwapHistory, data),
    );
  }

  async updateStatus(
    userSwapHistoryId: string,
    status: SwapStatus,
    entityManager?: EntityManager,
  ): Promise<void> {
    const updateData = {
      status,
      updated_at: new Date(),
    };

    if (entityManager) {
      await entityManager.update(
        UserSwapHistory,
        { user_swap_history_id: userSwapHistoryId },
        updateData,
      );
    } else {
      await this.userSwapHistoryRepo.update(
        { user_swap_history_id: userSwapHistoryId },
        updateData,
      );
    }
  }
}
