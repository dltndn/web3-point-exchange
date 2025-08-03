import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { UserPointRepository } from './repositories/user-point.repository';
import { ConsumptionHistoryRepository } from './repositories/consumption-history.repository';
import { GrantHistoryRepository } from './repositories/grant-history.repository';
import { UserSwapHistoryRepository } from '../swap/repositories/user-swap-history.repository';
import { UserRepository } from './repositories/user.repository';
import { RedisService } from '../redis/redis.service';
import { RedlockService } from '../redlock/redlock.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserStatus, ConsumptionStatus, GrantStatus } from './constants';

describe('PointService', () => {
  let service: PointService;
  let userPointRepository: jest.Mocked<UserPointRepository>;
  let consumptionHistoryRepository: jest.Mocked<ConsumptionHistoryRepository>;
  let grantHistoryRepository: jest.Mocked<GrantHistoryRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let redisService: jest.Mocked<RedisService>;
  let redlockService: jest.Mocked<RedlockService>;
  let blockchainService: jest.Mocked<BlockchainService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockUserPoint = {
    user_point_id: 1,
    user_id: 'user-123',
    balance: BigInt(1000),
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  };

  const mockUser = {
    user_id: 'user-123',
    wallet_address: '0xabcdef',
    status: UserStatus.VALID,
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  };

  const mockConsumptionHistory = {
    consumption_history_id: 'consumption-123',
    user_point: mockUserPoint,
    amount: BigInt(100),
    type: 1,
    status: ConsumptionStatus.COMPLETED,
    resource_id: 'resource-123',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  };

  const mockGrantHistory = {
    grant_history_id: 'grant-123',
    user_point: mockUserPoint,
    amount: BigInt(200),
    type: 1,
    status: GrantStatus.COMPLETED,
    resource_id: 'resource-123',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  };

  beforeEach(async () => {
    const mockUserPointRepository = {
      getWithPagination: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateBalance: jest.fn(),
    };

    const mockConsumptionHistoryRepository = {
      getWithPagination: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const mockGrantHistoryRepository = {
      getWithPagination: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const mockUserSwapHistoryRepository = {
      getWithPagination: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const mockUserRepository = {
      findById: jest.fn(),
      findByWalletAddress: jest.fn(),
      create: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const mockRedlockService = {
      executeWithLock: jest.fn(),
    };

    const mockRabbitmqService = {
      sendPointSwapTransaction: jest.fn(),
    };

    const mockBlockchainService = {
      setValidUser: jest.fn(),
      convertToWei: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: UserPointRepository,
          useValue: mockUserPointRepository,
        },
        {
          provide: ConsumptionHistoryRepository,
          useValue: mockConsumptionHistoryRepository,
        },
        {
          provide: GrantHistoryRepository,
          useValue: mockGrantHistoryRepository,
        },
        {
          provide: UserSwapHistoryRepository,
          useValue: mockUserSwapHistoryRepository,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: RedlockService,
          useValue: mockRedlockService,
        },
        {
          provide: RabbitmqService,
          useValue: mockRabbitmqService,
        },
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    userPointRepository = module.get(UserPointRepository);
    consumptionHistoryRepository = module.get(ConsumptionHistoryRepository);
    grantHistoryRepository = module.get(GrantHistoryRepository);
    userRepository = module.get(UserRepository);
    redisService = module.get(RedisService);
    redlockService = module.get(RedlockService);
    blockchainService = module.get(BlockchainService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPoints', () => {
    it('should return paginated user points', async () => {
      // Arrange
      const query = {
        limit: 10,
        offset: 0,
      };
      const mockData = {
        data: [mockUserPoint],
        total: 1,
      };
      userPointRepository.getWithPagination.mockResolvedValue(mockData as any);

      // Act
      const result = await service.getUserPoints(query as any);

      // Assert
      expect(userPointRepository.getWithPagination).toHaveBeenCalledWith(query);
      expect(result.count).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_point_id).toBe(1);
      expect(result.data[0].balance).toBe('1000');
    });
  });

  describe('getUserPoint', () => {
    it('should return user point when found', async () => {
      // Arrange
      const userPointId = 1;
      userPointRepository.findById.mockResolvedValue(mockUserPoint as any);

      // Act
      const result = await service.getUserPoint(userPointId);

      // Assert
      expect(userPointRepository.findById).toHaveBeenCalledWith(userPointId);
      expect(result.user_point_id).toBe(1);
      expect(result.user_id).toBe('user-123');
      expect(result.balance).toBe('1000');
    });

    it('should throw NotFoundException when user point not found', async () => {
      // Arrange
      const userPointId = 1;
      userPointRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserPoint(userPointId)).rejects.toThrow(
        NotFoundException,
      );
      expect(userPointRepository.findById).toHaveBeenCalledWith(userPointId);
    });
  });

  describe('createUserPoint', () => {
    it('should create user point without wallet address', async () => {
      // Arrange
      const createUserPointDto = {
        userId: 'user-123',
        amount: '1000',
      };

      userPointRepository.create.mockResolvedValue(mockUserPoint as any);
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      // Act
      const result = await service.createUserPoint(createUserPointDto as any);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.user_point_id).toBe(1);
      expect(result.balance).toBe('1000');
    });

    it('should create user point with new wallet address', async () => {
      // Arrange
      const createUserPointDto = {
        userId: 'user-123',
        walletAddress: '0xabcdef',
        amount: '1000',
      };

      userRepository.findByWalletAddress.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser as any);
      userPointRepository.create.mockResolvedValue(mockUserPoint as any);
      blockchainService.setValidUser.mockResolvedValue(undefined as any);
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      // Act
      const result = await service.createUserPoint(createUserPointDto as any);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(userRepository.findByWalletAddress).toHaveBeenCalledWith(
        '0xabcdef',
      );
      expect(userRepository.create).toHaveBeenCalled();
      expect(blockchainService.setValidUser).toHaveBeenCalledWith(
        '0xabcdef',
        true,
      );
      expect(result.user_point_id).toBe(1);
    });

    it('should create user point with existing wallet address', async () => {
      // Arrange
      const createUserPointDto = {
        userId: 'user-123',
        walletAddress: '0xabcdef',
        amount: '1000',
      };

      userRepository.findByWalletAddress.mockResolvedValue(mockUser as any);
      userPointRepository.create.mockResolvedValue(mockUserPoint as any);
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      // Act
      const result = await service.createUserPoint(createUserPointDto as any);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(userRepository.findByWalletAddress).toHaveBeenCalledWith(
        '0xabcdef',
      );
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(result.user_point_id).toBe(1);
    });
  });

  describe('getPointBalance', () => {
    it('should return balance from Redis cache', async () => {
      // Arrange
      const userId = 'user-123';
      redisService.get.mockResolvedValue('1000');

      // Act
      const result = await service.getPointBalance(userId);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(`point:balance:${userId}`);
      expect(result.balance).toBe('1000');
    });

    it('should return balance from database when Redis cache miss', async () => {
      // Arrange
      const userId = 'user-123';
      redisService.get.mockResolvedValue(null);
      userPointRepository.findByUserId.mockResolvedValue(mockUserPoint as any);
      redisService.set.mockResolvedValue(undefined as any);

      // Act
      const result = await service.getPointBalance(userId);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(`point:balance:${userId}`);
      expect(userPointRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(redisService.set).toHaveBeenCalledWith(
        `point:balance:${userId}`,
        '1000',
      );
      expect(result.balance).toBe('1000');
    });

    it('should throw NotFoundException when user point not found', async () => {
      // Arrange
      const userId = 'user-123';
      redisService.get.mockResolvedValue(null);
      userPointRepository.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPointBalance(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUserByWalletAddress', () => {
    it('should return user by wallet address', async () => {
      // Arrange
      const walletAddress = '0xabcdef';
      userRepository.findByWalletAddress.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.findUserByWalletAddress(walletAddress);

      // Assert
      expect(userRepository.findByWalletAddress).toHaveBeenCalledWith(
        walletAddress,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('increaseUserPointBalance', () => {
    it('should increase user point balance', async () => {
      // Arrange
      const userId = 'user-123';
      const amount = '500';
      const mockBalance = { balance: '1000' };

      redlockService.executeWithLock.mockImplementation(
        async (lockKey: string, expireTime: number, callback: any) => {
          return callback();
        },
      );

      // Mock getPointBalance method
      jest
        .spyOn(service, 'getPointBalance')
        .mockResolvedValue(mockBalance as any);
      userPointRepository.updateBalance.mockResolvedValue(undefined as any);
      redisService.set.mockResolvedValue(undefined as any);

      // Act
      await service.increaseUserPointBalance(userId, amount);

      // Assert
      expect(redlockService.executeWithLock).toHaveBeenCalled();
      expect(userPointRepository.updateBalance).toHaveBeenCalledWith(
        userId,
        BigInt(1500),
        undefined,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        `point:balance:${userId}`,
        '1500',
      );
    });
  });

  describe('consumePoint', () => {
    it('should consume point successfully', async () => {
      // Arrange
      const userPointId = 1;
      const consumePointDto = {
        amount: '100',
        type: 1,
        resourceId: 'resource-123',
      };

      userPointRepository.findById.mockResolvedValue(mockUserPoint as any);
      jest
        .spyOn(service, 'getPointBalance')
        .mockResolvedValue({ balance: '1000' } as any);
      redlockService.executeWithLock.mockImplementation(
        async (lockKey: string, expireTime: number, callback: any) => {
          return callback();
        },
      );
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });
      consumptionHistoryRepository.create.mockResolvedValue(
        mockConsumptionHistory as any,
      );
      consumptionHistoryRepository.findById.mockResolvedValue(
        mockConsumptionHistory as any,
      );

      // Act
      const result = await service.consumePoint(userPointId, consumePointDto);

      // Assert
      expect(userPointRepository.findById).toHaveBeenCalledWith(userPointId);
      expect(redlockService.executeWithLock).toHaveBeenCalled();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.consumption_history_id).toBe('consumption-123');
      expect(result.amount).toBe('100');
    });

    it('should throw NotFoundException when user point not found', async () => {
      // Arrange
      const userPointId = 1;
      const consumePointDto = {
        amount: '100',
        type: 1,
        resourceId: 'resource-123',
      };

      userPointRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.consumePoint(userPointId, consumePointDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      // Arrange
      const userPointId = 1;
      const consumePointDto = {
        amount: '2000',
        type: 1,
        resourceId: 'resource-123',
      };

      userPointRepository.findById.mockResolvedValue(mockUserPoint as any);
      jest
        .spyOn(service, 'getPointBalance')
        .mockResolvedValue({ balance: '1000' } as any);

      // Act & Assert
      await expect(
        service.consumePoint(userPointId, consumePointDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('grantPoint', () => {
    it('should grant point successfully', async () => {
      // Arrange
      const userPointId = 1;
      const grantPointDto = {
        amount: '200',
        type: 1,
        resourceId: 'resource-123',
      };

      userPointRepository.findById.mockResolvedValue(mockUserPoint as any);
      redlockService.executeWithLock.mockImplementation(
        async (lockKey: string, expireTime: number, callback: any) => {
          return callback();
        },
      );
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });
      grantHistoryRepository.create.mockResolvedValue(mockGrantHistory as any);
      grantHistoryRepository.findById.mockResolvedValue(
        mockGrantHistory as any,
      );

      // Act
      const result = await service.grantPoint(userPointId, grantPointDto);

      // Assert
      expect(userPointRepository.findById).toHaveBeenCalledWith(userPointId);
      expect(redlockService.executeWithLock).toHaveBeenCalled();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.grant_history_id).toBe('grant-123');
      expect(result.amount).toBe('200');
    });

    it('should throw NotFoundException when user point not found', async () => {
      // Arrange
      const userPointId = 1;
      const grantPointDto = {
        amount: '200',
        type: 1,
        resourceId: 'resource-123',
      };

      userPointRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.grantPoint(userPointId, grantPointDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
