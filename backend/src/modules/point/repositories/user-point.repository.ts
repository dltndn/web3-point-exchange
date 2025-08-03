import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserPoint } from '../entities/user-point.entity';
import { GetUserPointsReqQueryDto } from '../dto/user-point.dto';

/**
 * Repository for UserPoint entity
 */
@Injectable()
export class UserPointRepository {
  constructor(
    @InjectRepository(UserPoint)
    private readonly userPointRepo: Repository<UserPoint>,
  ) {}

  async findById(id: number): Promise<UserPoint | null> {
    return await this.userPointRepo.findOne({
      where: { user_point_id: id },
    });
  }

  async findByUserId(userId: string): Promise<UserPoint | null> {
    return await this.userPointRepo.findOne({
      where: { user_id: userId },
    });
  }

  async create(
    userId: string,
    balance: bigint = BigInt(0),
    entityManager?: EntityManager,
  ): Promise<UserPoint> {
    if (entityManager) {
      const userPoint = entityManager.create(UserPoint, {
        user_id: userId,
        balance,
      });
      return await entityManager.save(userPoint);
    }

    const userPoint = this.userPointRepo.create({ user_id: userId, balance });
    return await this.userPointRepo.save(userPoint);
  }

  async updateBalance(
    userId: string,
    newBalance: bigint,
    entityManager?: EntityManager,
  ): Promise<void> {
    const updateData = {
      balance: newBalance,
      updated_at: new Date(),
    };

    if (entityManager) {
      await entityManager.update(UserPoint, { user_id: userId }, updateData);
    } else {
      await this.userPointRepo.update({ user_id: userId }, updateData);
    }
  }

  async getWithPagination({ userId }: GetUserPointsReqQueryDto): Promise<{
    data: UserPoint[];
    total: number;
  }> {
    const queryBuilder = this.userPointRepo.createQueryBuilder('up');

    if (userId) {
      queryBuilder.andWhere('up.user_id = :userId', { userId });
    }

    queryBuilder.orderBy('up.created_at', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }
}
