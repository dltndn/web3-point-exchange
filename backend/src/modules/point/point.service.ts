import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  GetUserPointsReqQueryDto,
  CreateUserPointReqDto,
  UserPointResDto,
  UserPointListResDto,
  DepositPointsReqDto,
  WithdrawPointsReqDto,
  UserPointBalanceResDto,
  ValidateUserReqBodyDto,
  SuccessResDto,
} from './dto/user-point.dto';
import {
  GetConsumptionHistoriesReqQueryDto,
  ConsumePointReqDto,
  ConsumptionHistoryResDto,
  ConsumptionHistoryListResDto,
} from './dto/consumption-history.dto';
import {
  GetGrantHistoriesReqQueryDto,
  GrantPointReqDto,
  GrantHistoryResDto,
  GrantHistoryListResDto,
} from './dto/grant-history.dto';
import {
  GetUserSwapHistoriesReqQueryDto,
  UserSwapHistoryResDto,
  UserSwapHistoryListResDto,
} from '../swap/dto/user-swap-history.dto';
import { UserPointRepository } from './repositories/user-point.repository';
import { ConsumptionHistoryRepository } from './repositories/consumption-history.repository';
import { GrantHistoryRepository } from './repositories/grant-history.repository';
import { UserSwapHistoryRepository } from '../swap/repositories/user-swap-history.repository';
import { UserPoint } from './entities/user-point.entity';
import { ConsumptionHistory } from './entities/consumption-history.entity';
import { GrantHistory } from './entities/grant-history.entity';
import { UserSwapHistory } from '../swap/entities/user-swap-history.entity';
import { UserRepository } from './repositories/user.repository';
import { POINT_BALANCE_KEY, UserStatus } from './constants';
import { RedisService } from '../redis/redis.service';
import { RedlockService } from '../redlock/redlock.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Config } from '../../config/environment/config';
import { SwapType, SwapStatus } from '../swap/constants';
import {
  HANDLE_POINT_LOCK,
  HANDLE_POINT_LOCK_EXPIRE_TIME,
} from '../redlock/constants';
import { PointSwapTransactioRmqDto } from '../rabbitmq/dto/point-swap-transaction.dto';
import { ConsumptionStatus, GrantStatus } from './constants';

@Injectable()
export class PointService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userPointRepository: UserPointRepository,
    private readonly consumptionHistoryRepository: ConsumptionHistoryRepository,
    private readonly grantHistoryRepository: GrantHistoryRepository,
    private readonly userSwapHistoryRepository: UserSwapHistoryRepository,
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly redlockService: RedlockService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly blockchainService: BlockchainService,
  ) {}

  /**
   * 사용자 포인트 목록 조회
   */
  async getUserPoints(
    query: GetUserPointsReqQueryDto,
  ): Promise<UserPointListResDto> {
    const { data, total } =
      await this.userPointRepository.getWithPagination(query);

    return {
      count: total,
      data: data.map((entity) => this.mapUserPoint(entity)),
    };
  }

  /**
   * 사용자 포인트 상세 조회
   */
  async getUserPoint(userPointId: number): Promise<UserPointResDto> {
    const entity = await this.userPointRepository.findById(userPointId);

    if (!entity) {
      throw new NotFoundException('User point not found');
    }

    return this.mapUserPoint(entity);
  }

  /**
   * 사용자 포인트 생성
   */
  async createUserPoint(
    createUserPointDto: CreateUserPointReqDto,
  ): Promise<UserPointResDto> {
    return await this.dataSource.transaction(async (entityManager) => {
      const { userId, walletAddress, amount = '0' } = createUserPointDto;
      const balance = BigInt(amount);

      // User 엔티티가 존재하지 않으면 생성
      if (walletAddress) {
        const existingUser =
          await this.userRepository.findByWalletAddress(walletAddress);

        if (!existingUser) {
          await this.userRepository.create(
            userId,
            walletAddress,
            entityManager,
          );

          await this.blockchainService.setValidUser(walletAddress, true);
        }
      }

      // UserPoint 엔티티 생성
      const userPointEntity = await this.userPointRepository.create(
        userId,
        balance,
        entityManager,
      );

      return this.mapUserPoint(userPointEntity);
    });
  }

  /**
   * 사용자 포인트 소비 내역 조회
   */
  async getConsumptionHistories(
    userPointId: number,
    query: GetConsumptionHistoriesReqQueryDto,
  ): Promise<ConsumptionHistoryListResDto> {
    const { data, total } =
      await this.consumptionHistoryRepository.getWithPagination({
        ...query,
        userPointId,
      });

    return {
      count: total,
      data: data.map((entity) => this.mapConsumptionHistory(entity)),
    };
  }

  /**
   * 사용자 포인트 소비 내역 상세 조회
   */
  async getConsumptionHistory(
    userPointId: number,
    consumptionHistoryId: string,
  ): Promise<ConsumptionHistoryResDto> {
    const entity = await this.consumptionHistoryRepository.findByUserPointId(
      userPointId,
      consumptionHistoryId,
    );

    if (!entity) {
      throw new NotFoundException('Consumption history not found');
    }

    return this.mapConsumptionHistory(entity);
  }

  /**
   * 포인트 입금
   */
  async depositPoints(
    depositPointsDto: DepositPointsReqDto,
  ): Promise<UserSwapHistoryResDto> {
    const { userId, walletAddress, amount } = depositPointsDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.VALID) {
      throw new BadRequestException('User is not valid');
    }

    const userByWallet =
      await this.userRepository.findByWalletAddress(walletAddress);
    if (!userByWallet || userByWallet.user_id !== userId) {
      throw new BadRequestException('Wallet address does not match user');
    }

    // userId 락 획득
    const lockKey = HANDLE_POINT_LOCK(userId);

    return await this.redlockService.executeWithLock(
      lockKey,
      HANDLE_POINT_LOCK_EXPIRE_TIME,
      async () => {
        // amount 검증(잔액 조회)
        const currentBalance = await this.getPointBalance(userId);
        const currentBalanceBigInt = BigInt(currentBalance.balance);
        const depositAmountBigInt = BigInt(amount);

        if (currentBalanceBigInt < depositAmountBigInt) {
          throw new BadRequestException('Insufficient balance for deposit');
        }

        return await this.dataSource.transaction(async (entityManager) => {
          // 환율 계산 및 토큰 금액 산출
          const exchangeRate = BigInt(
            Config.getEnvironment().POINT_TOKEN_EXCHANGE_RATE,
          );
          const tokenAmountBigInt = depositAmountBigInt / exchangeRate;
          const tokenAmount = tokenAmountBigInt.toString();

          // user_swap_history entity 생성
          const userSwapHistory = await this.userSwapHistoryRepository.create(
            userId,
            SwapType.POINT_TO_TOKEN,
            depositAmountBigInt,
            BigInt(tokenAmount),
            SwapStatus.PENDING,
            entityManager,
          );

          // user_point entity balance 업데이트(balance 차감)
          const userPoint = await this.userPointRepository.findByUserId(userId);
          if (!userPoint) {
            throw new NotFoundException('User point not found');
          }

          const newBalance = BigInt(userPoint.balance) - depositAmountBigInt;
          await this.userPointRepository.updateBalance(
            userId,
            newBalance,
            entityManager,
          );

          // Redis 캐시 업데이트
          try {
            await this.redisService.set(
              POINT_BALANCE_KEY(userId),
              newBalance.toString(),
            );
          } catch (e) {
            console.error('Failed to update Redis cache:', e);
          }

          // RabbitMQ 메시지 전송
          const rmqDto: PointSwapTransactioRmqDto = {
            userSwapHistoryId: userSwapHistory.user_swap_history_id,
            walletAddress,
            amount: depositAmountBigInt.toString(),
            type: SwapType.POINT_TO_TOKEN,
          };

          this.rabbitmqService.sendPointSwapTransaction(rmqDto);

          return this.mapUserSwapHistory(userSwapHistory);
        });
      },
    );
  }

  /**
   * 포인트 출금
   */
  async withdrawPoints(
    withdrawPointsDto: WithdrawPointsReqDto,
  ): Promise<UserSwapHistoryResDto> {
    const { userId, walletAddress, amount, validUntil, signature, permitData } =
      withdrawPointsDto;

    // 사용자 존재 여부와 walletAddress/userId 매칭 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.VALID) {
      throw new BadRequestException('User is not valid');
    }

    const userByWallet =
      await this.userRepository.findByWalletAddress(walletAddress);
    if (!userByWallet || userByWallet.user_id !== userId) {
      throw new BadRequestException('Wallet address does not match user');
    }

    // 환율 계산 및 토큰 금액 산출 (토큰 -> 포인트)
    const exchangeRate = BigInt(
      Config.getEnvironment().POINT_TOKEN_EXCHANGE_RATE,
    );
    const withdrawAmountBigInt = BigInt(amount);
    const tokenAmountBigInt = withdrawAmountBigInt / exchangeRate;
    const tokenAmount = tokenAmountBigInt.toString();

    // token balance 유효성 확인 (Wei 단위 비교)
    const tokenBalanceWei =
      await this.blockchainService.getTokenBalance(walletAddress);
    const tokenBalanceWeiBigInt = BigInt(tokenBalanceWei);

    // 출금 요청 토큰 금액을 Wei 단위로 변환하여 비교
    const tokenAmountWei = this.blockchainService.convertToWei(tokenAmount);
    const tokenAmountWeiBigInt = BigInt(tokenAmountWei);

    if (tokenBalanceWeiBigInt < tokenAmountWeiBigInt) {
      throw new BadRequestException(
        'Insufficient token balance for withdrawal',
      );
    }

    // userId 락 획득
    const lockKey = HANDLE_POINT_LOCK(userId);

    return await this.redlockService.executeWithLock(
      lockKey,
      HANDLE_POINT_LOCK_EXPIRE_TIME,
      async () => {
        return await this.dataSource.transaction(async (entityManager) => {
          // user_swap_history entity 생성 (TOKEN_TO_POINT)
          const userSwapHistory = await this.userSwapHistoryRepository.create(
            userId,
            SwapType.TOKEN_TO_POINT,
            withdrawAmountBigInt,
            BigInt(tokenAmount),
            SwapStatus.PENDING,
            entityManager,
          );

          // token to point 에서는 블록체인에 최종 반영이 된 이후에 point balance 업데이트

          // RabbitMQ 메시지 전송
          const rmqDto: PointSwapTransactioRmqDto = {
            userSwapHistoryId: userSwapHistory.user_swap_history_id,
            walletAddress,
            amount: withdrawAmountBigInt.toString(),
            type: SwapType.TOKEN_TO_POINT,
            signature,
            validUntil,
            permitData: permitData ? permitData : undefined,
          };

          this.rabbitmqService.sendPointSwapTransaction(rmqDto);

          return this.mapUserSwapHistory(userSwapHistory);
        });
      },
    );
  }

  /**
   * 포인트 소비
   */
  async consumePoint(
    userPointId: number,
    consumePointDto: ConsumePointReqDto,
  ): Promise<ConsumptionHistoryResDto> {
    const { amount, type, resourceId } = consumePointDto;
    const consumeAmountBigInt = BigInt(amount);

    // user_point entity 조회
    const userPoint = await this.userPointRepository.findById(userPointId);
    if (!userPoint) {
      throw new NotFoundException('User point not found');
    }

    // point balance 조회
    const currentBalance = await this.getPointBalance(userPoint.user_id);
    const currentBalanceBigInt = BigInt(currentBalance.balance);

    if (currentBalanceBigInt < consumeAmountBigInt) {
      throw new BadRequestException('Insufficient balance for consumption');
    }

    // user_id 락 획득
    const lockKey = HANDLE_POINT_LOCK(userPoint.user_id);

    return await this.redlockService.executeWithLock(
      lockKey,
      HANDLE_POINT_LOCK_EXPIRE_TIME,
      async () => {
        return await this.dataSource.transaction(async (entityManager) => {
          // consumption_history entity 생성
          // 현재는 force 옵션 여부와 상관 없이 status 값은 ConsumptionStatus.COMPLETED 로 설정
          const consumptionHistory =
            await this.consumptionHistoryRepository.create(
              userPointId,
              consumeAmountBigInt,
              type,
              ConsumptionStatus.COMPLETED,
              resourceId,
              entityManager,
            );

          // user_point entity balance 업데이트
          const newBalance = BigInt(userPoint.balance) - consumeAmountBigInt;
          await this.userPointRepository.updateBalance(
            userPoint.user_id,
            newBalance,
            entityManager,
          );

          // redis 캐시 업데이트
          try {
            await this.redisService.set(
              POINT_BALANCE_KEY(userPoint.user_id),
              newBalance.toString(),
            );
          } catch (e) {
            console.error('Failed to update Redis cache:', e);
          }

          // consumption_history 반환
          return this.mapConsumptionHistory(consumptionHistory);
        });
      },
    );
  }

  /**
   * 포인트 소비 롤백
   */
  rollbackConsumption(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userPointId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _consumptionHistoryId: string,
  ): Promise<ConsumptionHistoryResDto> {
    throw new Error('Not implemented');
  }

  /**
   * 사용자 포인트 지급 내역 조회
   */
  async getGrantHistories(
    userPointId: number,
    query: GetGrantHistoriesReqQueryDto,
  ): Promise<GrantHistoryListResDto> {
    const { data, total } = await this.grantHistoryRepository.getWithPagination(
      {
        ...query,
        userPointId,
      },
    );

    return {
      count: total,
      data: data.map((entity) => this.mapGrantHistory(entity)),
    };
  }

  /**
   * 사용자 포인트 지급 내역 상세 조회
   */
  async getGrantHistory(
    userPointId: number,
    grantHistoryId: string,
  ): Promise<GrantHistoryResDto> {
    const entity = await this.grantHistoryRepository.findByUserPointId(
      userPointId,
      grantHistoryId,
    );

    if (!entity) {
      throw new NotFoundException('Grant history not found');
    }

    return this.mapGrantHistory(entity);
  }

  /**
   * 포인트 지급
   */
  async grantPoint(
    userPointId: number,
    grantPointDto: GrantPointReqDto,
  ): Promise<GrantHistoryResDto> {
    const { amount, type, resourceId } = grantPointDto;
    const grantAmountBigInt = BigInt(amount);

    // user_point entity 조회
    const userPoint = await this.userPointRepository.findById(userPointId);
    if (!userPoint) {
      throw new NotFoundException('User point not found');
    }

    // user_id 락 획득
    const lockKey = HANDLE_POINT_LOCK(userPoint.user_id);

    return await this.redlockService.executeWithLock(
      lockKey,
      HANDLE_POINT_LOCK_EXPIRE_TIME,
      async () => {
        return await this.dataSource.transaction(async (entityManager) => {
          // grant_history entity 생성
          // 현재는 force 옵션 여부와 상관 없이 status 값은 GrantStatus.COMPLETED 로 설정
          const grantHistory = await this.grantHistoryRepository.create(
            userPointId,
            grantAmountBigInt,
            type,
            GrantStatus.COMPLETED,
            resourceId,
            entityManager,
          );

          // user_point entity balance 업데이트
          const newBalance = BigInt(userPoint.balance) + grantAmountBigInt;
          await this.userPointRepository.updateBalance(
            userPoint.user_id,
            newBalance,
            entityManager,
          );

          // redis 캐시 업데이트
          try {
            await this.redisService.set(
              POINT_BALANCE_KEY(userPoint.user_id),
              newBalance.toString(),
            );
          } catch (e) {
            console.error('Failed to update Redis cache:', e);
          }

          // grant_history 반환
          return this.mapGrantHistory(grantHistory);
        });
      },
    );
  }

  /**
   * 포인트 지급 롤백
   */
  rollbackGrant(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userPointId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _grantHistoryId: string,
  ): Promise<GrantHistoryResDto> {
    throw new Error('Not implemented');
  }

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
    const entity =
      await this.userSwapHistoryRepository.findById(userSwapHistoryId);

    if (!entity) {
      throw new NotFoundException('User swap history not found');
    }

    return this.mapUserSwapHistory(entity);
  }

  /**
   * 포인트 잔액 조회
   */
  async getPointBalance(userId: string): Promise<UserPointBalanceResDto> {
    // redis 조회
    const redisUserPoint = await this.redisService.get(
      POINT_BALANCE_KEY(userId),
    );

    if (redisUserPoint) {
      return {
        balance: redisUserPoint,
      };
    }

    // db 조회
    const userPoint = await this.userPointRepository.findByUserId(userId);

    if (!userPoint) {
      throw new NotFoundException('User point not found');
    }

    const balance = userPoint.balance.toString();

    try {
      // redis 저장
      await this.redisService.set(POINT_BALANCE_KEY(userId), balance);
    } catch (e) {
      console.error(e);
    }

    return {
      balance,
    };
  }

  async validateUser(body: ValidateUserReqBodyDto): Promise<SuccessResDto> {
    const { walletAddress, isValid } = body;

    const user = await this.userRepository.findByWalletAddress(walletAddress);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (isValid) {
      if (user.status === UserStatus.VALID) {
        return { success: true };
      }
      await this.userRepository.update(user.user_id, {
        status: UserStatus.VALID,
        updated_at: new Date(),
      });
    } else {
      if (user.status === UserStatus.INVALID) {
        return { success: true };
      }
      await this.userRepository.update(user.user_id, {
        status: UserStatus.INVALID,
        updated_at: new Date(),
      });
    }

    return { success: true };
  }

  /**
   * 지갑 주소로 사용자 조회
   */
  async findUserByWalletAddress(walletAddress: string) {
    return await this.userRepository.findByWalletAddress(walletAddress);
  }

  /**
   * 사용자 포인트 잔액 증가
   * MQ 처리 전용 메서드
   */
  async increaseUserPointBalance(
    userId: string,
    amount: string,
    entityManager?: EntityManager,
  ): Promise<void> {
    // user_id 락 획득
    const lockKey = HANDLE_POINT_LOCK(userId);

    return await this.redlockService.executeWithLock(
      lockKey,
      HANDLE_POINT_LOCK_EXPIRE_TIME,
      async () => {
        const currentBalance = await this.getPointBalance(userId);
        const currentBalanceBigInt = BigInt(currentBalance.balance);
        const increaseAmountBigInt = BigInt(amount);
        const newBalance = currentBalanceBigInt + increaseAmountBigInt;

        await this.userPointRepository.updateBalance(
          userId,
          newBalance,
          entityManager,
        );

        // Redis 캐시 업데이트
        try {
          await this.redisService.set(
            POINT_BALANCE_KEY(userId),
            newBalance.toString(),
          );
        } catch (e) {
          console.error('Failed to update Redis cache:', e);
        }
      },
    );
  }

  private mapUserPoint(entity: UserPoint): UserPointResDto {
    return {
      user_point_id: entity.user_point_id,
      user_id: entity.user_id,
      balance: entity.balance.toString(),
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
    };
  }

  private mapConsumptionHistory(
    entity: ConsumptionHistory,
  ): ConsumptionHistoryResDto {
    return {
      consumption_history_id: entity.consumption_history_id,
      user_point_id: entity.user_point.user_point_id,
      amount: entity.amount.toString(),
      type: entity.type,
      status: entity.status,
      resource_id: entity.resource_id || '',
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
    };
  }

  private mapGrantHistory(entity: GrantHistory): GrantHistoryResDto {
    return {
      grant_history_id: entity.grant_history_id,
      user_point_id: entity.user_point.user_point_id,
      amount: entity.amount.toString(),
      type: entity.type,
      status: entity.status,
      resource_id: entity.resource_id || '',
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
    };
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
