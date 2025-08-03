import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ConsumptionHistory } from '../entities/consumption-history.entity';
import { GetConsumptionHistoriesReqQueryDto } from '../dto/consumption-history.dto';
import { ConsumptionType, ConsumptionStatus } from '../constants';

/**
 * Repository for ConsumptionHistory entity
 */
@Injectable()
export class ConsumptionHistoryRepository {
  constructor(
    @InjectRepository(ConsumptionHistory)
    private readonly consumptionHistoryRepo: Repository<ConsumptionHistory>,
  ) {}

  async findById(id: string): Promise<ConsumptionHistory | null> {
    return await this.consumptionHistoryRepo.findOne({
      where: { consumption_history_id: id },
      relations: ['user_point'],
    });
  }

  async findByUserPointId(
    userPointId: number,
    consumptionHistoryId: string,
  ): Promise<ConsumptionHistory | null> {
    return await this.consumptionHistoryRepo.findOne({
      where: {
        consumption_history_id: consumptionHistoryId,
        user_point: { user_point_id: userPointId },
      },
      relations: ['user_point'],
    });
  }

  async create(
    userPointId: number,
    amount: bigint,
    type: ConsumptionType,
    status: ConsumptionStatus,
    resourceId?: string,
    entityManager?: EntityManager,
  ): Promise<ConsumptionHistory> {
    const consumptionData = {
      user_point: { user_point_id: userPointId },
      amount,
      type,
      status,
      resource_id: resourceId,
    };

    if (entityManager) {
      const consumptionHistory = entityManager.create(
        ConsumptionHistory,
        consumptionData,
      );
      return await entityManager.save(consumptionHistory);
    }

    const consumptionHistory =
      this.consumptionHistoryRepo.create(consumptionData);
    return await this.consumptionHistoryRepo.save(consumptionHistory);
  }

  async getWithPagination({
    userPointId,
    type,
    status,
    lastId,
    limit = 10,
    offset = 0,
    order = 'DESC',
  }: GetConsumptionHistoriesReqQueryDto & {
    userPointId?: number;
  }): Promise<{
    data: ConsumptionHistory[];
    total: number;
  }> {
    const queryBuilder = this.consumptionHistoryRepo.createQueryBuilder('ch');

    queryBuilder.leftJoinAndSelect('ch.user_point', 'up');

    if (userPointId) {
      queryBuilder.andWhere('up.user_point_id = :userPointId', {
        userPointId,
      });
    }

    if (type) {
      queryBuilder.andWhere('ch.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('ch.status = :status', { status });
    }

    if (lastId) {
      const op = order === 'ASC' ? '>' : '<';
      queryBuilder.andWhere(`ch.consumption_history_id ${op} :lastId`, {
        lastId,
      });
    }

    queryBuilder.orderBy('ch.created_at', order as 'ASC' | 'DESC');
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }
}
