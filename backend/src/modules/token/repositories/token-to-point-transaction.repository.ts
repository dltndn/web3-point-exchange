import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In } from 'typeorm';
import { TokenToPointTransaction } from '../entities/token-to-point-transaction.entity';
import {
  CreateTokenToPointTransactionsDataDto,
  GetTokenToPointTransactionsReqQueryDto,
} from '../dto/token-to-point-transaction.dto';
import { TokenStatus } from '../constants';

/**
 * Repository for TokenToPointTransaction entity
 */
@Injectable()
export class TokenToPointTransactionRepository {
  constructor(
    @InjectRepository(TokenToPointTransaction)
    private readonly tokenToPointTransactionRepo: Repository<TokenToPointTransaction>,
  ) {}

  async findById(id: number): Promise<TokenToPointTransaction | null> {
    return await this.tokenToPointTransactionRepo.findOne({
      where: { token_to_point_transaction_id: id },
    });
  }

  async findByTransactionHash(
    transactionHash: string,
  ): Promise<TokenToPointTransaction[]> {
    return await this.tokenToPointTransactionRepo.find({
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
      token_to_point_transaction_id: ids.length === 1 ? ids[0] : In(ids),
    };

    if (entityManager) {
      await entityManager.update(
        TokenToPointTransaction,
        whereCondition,
        updateData,
      );
    } else {
      await this.tokenToPointTransactionRepo.update(whereCondition, updateData);
    }
  }

  async getWithPagination({
    transactionHash,
    status,
    lastId,
    limit = 10,
    offset = 0,
    order = 'DESC',
  }: GetTokenToPointTransactionsReqQueryDto): Promise<{
    data: TokenToPointTransaction[];
    total: number;
  }> {
    const queryBuilder =
      this.tokenToPointTransactionRepo.createQueryBuilder('ttp');

    if (transactionHash) {
      queryBuilder.andWhere('ttp.transaction_hash = :transactionHash', {
        transactionHash,
      });
    }

    if (status) {
      queryBuilder.andWhere('ttp.status = :status', { status });
    }

    if (lastId) {
      const op = order === 'ASC' ? '>' : '<';
      queryBuilder.andWhere(`ttp.token_to_point_transaction_id ${op} :lastId`, {
        lastId,
      });
    }

    queryBuilder.orderBy(
      'ttp.token_to_point_transaction_id',
      order as 'ASC' | 'DESC',
    );
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async create(
    data: CreateTokenToPointTransactionsDataDto,
    entityManager?: EntityManager,
  ): Promise<TokenToPointTransaction> {
    if (entityManager) {
      const tokenToPointTransaction = entityManager.create(
        TokenToPointTransaction,
        {
          transaction_hash: data.transactionHash,
          status: data.status,
          amount: BigInt(data.tokenAmount),
        },
      );
      return await entityManager.save(tokenToPointTransaction);
    }
    const tokenToPointTransaction = this.tokenToPointTransactionRepo.create({
      transaction_hash: data.transactionHash,
      status: data.status,
      amount: BigInt(data.tokenAmount),
    });
    return await this.tokenToPointTransactionRepo.save(tokenToPointTransaction);
  }
}
