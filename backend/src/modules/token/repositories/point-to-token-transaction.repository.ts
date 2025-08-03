import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In } from 'typeorm';
import { PointToTokenTransaction } from '../entities/point-to-token-transaction.entity';
import {
  CreatePointToTokenTransactionsDataDto,
  GetPointToTokenTransactionsReqQueryDto,
} from '../dto/point-to-token-transaction.dto';
import { TokenStatus } from '../constants';

/**
 * Repository for PointToTokenTransaction entity
 */
@Injectable()
export class PointToTokenTransactionRepository {
  constructor(
    @InjectRepository(PointToTokenTransaction)
    private readonly pointToTokenTransactionRepo: Repository<PointToTokenTransaction>,
  ) {}

  async findById(id: number): Promise<PointToTokenTransaction | null> {
    return await this.pointToTokenTransactionRepo.findOne({
      where: { point_to_token_transaction_id: id },
    });
  }

  async findByTransactionHash(
    transactionHash: string,
  ): Promise<PointToTokenTransaction[]> {
    return await this.pointToTokenTransactionRepo.find({
      where: { transaction_hash: transactionHash },
    });
  }

  async updateStatusByIds(
    ids: number[],
    status: TokenStatus,
    entityManager?: EntityManager,
  ): Promise<void> {
    if (ids.length === 0) return;

    const updateData = {
      status,
      updated_at: new Date(),
    };

    const whereCondition = {
      point_to_token_transaction_id: ids.length === 1 ? ids[0] : In(ids),
    };

    if (entityManager) {
      await entityManager.update(
        PointToTokenTransaction,
        whereCondition,
        updateData,
      );
    } else {
      await this.pointToTokenTransactionRepo.update(whereCondition, updateData);
    }
  }

  async getWithPagination({
    transactionHash,
    status,
    lastId,
    limit = 10,
    offset = 0,
    order = 'DESC',
  }: GetPointToTokenTransactionsReqQueryDto): Promise<{
    data: PointToTokenTransaction[];
    total: number;
  }> {
    const queryBuilder =
      this.pointToTokenTransactionRepo.createQueryBuilder('ptt');

    if (transactionHash) {
      queryBuilder.andWhere('ptt.transaction_hash = :transactionHash', {
        transactionHash,
      });
    }

    if (status) {
      queryBuilder.andWhere('ptt.status = :status', { status });
    }

    if (lastId) {
      const op = order === 'ASC' ? '>' : '<';
      queryBuilder.andWhere(`ptt.point_to_token_transaction_id ${op} :lastId`, {
        lastId,
      });
    }

    queryBuilder.orderBy(
      'ptt.point_to_token_transaction_id',
      order as 'ASC' | 'DESC',
    );
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async create(
    data: CreatePointToTokenTransactionsDataDto,
    entityManager?: EntityManager,
  ): Promise<PointToTokenTransaction> {
    if (entityManager) {
      const pointToTokenTransaction = entityManager.create(
        PointToTokenTransaction,
        {
          transaction_hash: data.transactionHash,
          status: data.status,
          amount: BigInt(data.tokenAmount),
        },
      );
      return await entityManager.save(pointToTokenTransaction);
    }
    const pointToTokenTransaction = this.pointToTokenTransactionRepo.create({
      transaction_hash: data.transactionHash,
      status: data.status,
      amount: BigInt(data.tokenAmount),
    });
    return await this.pointToTokenTransactionRepo.save(pointToTokenTransaction);
  }
}
