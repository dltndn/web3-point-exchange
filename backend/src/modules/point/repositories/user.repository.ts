import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserStatus } from '../constants';

/**
 * Repository for User entity
 */
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { user_id: id },
    });
  }

  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { wallet_address: walletAddress },
    });
  }

  async create(
    userId: string,
    walletAddress: string,
    entityManager?: EntityManager,
  ): Promise<User> {
    if (entityManager) {
      const user = entityManager.create(User, {
        user_id: userId,
        wallet_address: walletAddress,
        status: UserStatus.PENDING,
      });
      return await entityManager.save(user);
    }

    const user = this.userRepo.create({
      user_id: userId,
      wallet_address: walletAddress,
      status: UserStatus.PENDING,
    });
    return await this.userRepo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { user_id: id },
    });
    if (!user) {
      return null;
    }
    return await this.userRepo.save(Object.assign(user, data));
  }
}
