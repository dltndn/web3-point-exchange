import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { GrantHistory } from '../entities/grant-history.entity';
import { GetGrantHistoriesReqQueryDto } from '../dto/grant-history.dto';
import { GrantType, GrantStatus } from '../constants';

/**
 * Repository for GrantHistory entity
 */
@Injectable()
export class GrantHistoryRepository {
  constructor(
    @InjectRepository(GrantHistory)
    private readonly grantHistoryRepo: Repository<GrantHistory>,
  ) {}

  async findById(id: string): Promise<GrantHistory | null> {
    return await this.grantHistoryRepo.findOne({
      where: { grant_history_id: id },
      relations: ['user_point'],
    });
  }

  async findByUserPointId(
    userPointId: number,
    grantHistoryId: string,
  ): Promise<GrantHistory | null> {
    return await this.grantHistoryRepo.findOne({
      where: {
        grant_history_id: grantHistoryId,
        user_point: { user_point_id: userPointId },
      },
      relations: ['user_point'],
    });
  }

  async create(
    userPointId: number,
    amount: bigint,
    type: GrantType,
    status: GrantStatus,
    resourceId?: string,
    entityManager?: EntityManager,
  ): Promise<GrantHistory> {
    const grantData = {
      user_point: { user_point_id: userPointId },
      amount,
      type,
      status,
      resource_id: resourceId,
    };

    if (entityManager) {
      const grantHistory = entityManager.create(GrantHistory, grantData);
      return await entityManager.save(grantHistory);
    }

    const grantHistory = this.grantHistoryRepo.create(grantData);
    return await this.grantHistoryRepo.save(grantHistory);
  }

  async getWithPagination({
    userPointId,
    type,
    status,
    lastId,
    limit = 10,
    offset = 0,
    order = 'DESC',
  }: GetGrantHistoriesReqQueryDto & {
    userPointId?: number;
  }): Promise<{
    data: GrantHistory[];
    total: number;
  }> {
    const queryBuilder = this.grantHistoryRepo.createQueryBuilder('gh');

    queryBuilder.leftJoinAndSelect('gh.user_point', 'up');

    if (userPointId) {
      queryBuilder.andWhere('up.user_point_id = :userPointId', {
        userPointId,
      });
    }

    if (type) {
      queryBuilder.andWhere('gh.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('gh.status = :status', { status });
    }

    if (lastId) {
      const op = order === 'ASC' ? '>' : '<';
      queryBuilder.andWhere(`gh.grant_history_id ${op} :lastId`, {
        lastId,
      });
    }

    queryBuilder.orderBy('gh.created_at', order as 'ASC' | 'DESC');
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }
}
