import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { PointToTokenTransactionRepository } from './repositories/point-to-token-transaction.repository';
import { TokenToPointTransactionRepository } from './repositories/token-to-point-transaction.repository';
import { SwapService } from '../swap/swap.service';
import { PointService } from '../point/point.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TokenStatus } from './constants';

import { UpdateUserPointBalanceType } from '../rabbitmq/constants';

describe('TokenService', () => {
  let service: TokenService;
  let pointToTokenTxRepository: jest.Mocked<PointToTokenTransactionRepository>;
  let tokenToPointTxRepository: jest.Mocked<TokenToPointTransactionRepository>;
  let swapService: jest.Mocked<SwapService>;
  let pointService: jest.Mocked<PointService>;
  let rabbitmqService: jest.Mocked<RabbitmqService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockPointToTokenTransaction = {
    point_to_token_transaction_id: 1,
    transaction_hash: '0x123',
    status: TokenStatus.PROCESSED,
    amount: BigInt(1000),
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    user_swap_histories: [],
  };

  const mockTokenToPointTransaction = {
    token_to_point_transaction_id: 1,
    transaction_hash: '0x456',
    status: TokenStatus.PROCESSED,
    amount: BigInt(2000),
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    user_swap_histories: [],
  };

  const mockUser = {
    user_id: 'user-123',
    wallet_address: '0xabcdef',
    status: 1,
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  };

  beforeEach(async () => {
    const mockPointToTokenTxRepository = {
      getWithPagination: jest.fn(),
      findById: jest.fn(),
      findByTransactionHash: jest.fn(),
      updateStatusByIds: jest.fn(),
      create: jest.fn(),
    };

    const mockTokenToPointTxRepository = {
      getWithPagination: jest.fn(),
      findById: jest.fn(),
      findByTransactionHash: jest.fn(),
      updateStatusByIds: jest.fn(),
      create: jest.fn(),
    };

    const mockSwapService = {
      updateSwapHistoryStatusByTokenMintHistoryIds: jest.fn(),
      updateSwapHistoryStatusByTokenBurnHistoryIds: jest.fn(),
      createUserSwapHistory: jest.fn(),
      updateSwapHistoryById: jest.fn(),
    };

    const mockPointService = {
      findUserByWalletAddress: jest.fn(),
    };

    const mockRabbitmqService = {
      sendPointUpdateBalance: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: PointToTokenTransactionRepository,
          useValue: mockPointToTokenTxRepository,
        },
        {
          provide: TokenToPointTransactionRepository,
          useValue: mockTokenToPointTxRepository,
        },
        {
          provide: SwapService,
          useValue: mockSwapService,
        },
        {
          provide: PointService,
          useValue: mockPointService,
        },
        {
          provide: RabbitmqService,
          useValue: mockRabbitmqService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    pointToTokenTxRepository = module.get(PointToTokenTransactionRepository);
    tokenToPointTxRepository = module.get(TokenToPointTransactionRepository);
    swapService = module.get(SwapService);
    pointService = module.get(PointService);
    rabbitmqService = module.get(RabbitmqService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPointToTokenTransactions', () => {
    it('should return paginated point to token transactions', async () => {
      // Arrange
      const query = {
        limit: 10,
        offset: 0,
      };
      const mockData = {
        data: [mockPointToTokenTransaction],
        total: 1,
      };
      pointToTokenTxRepository.getWithPagination.mockResolvedValue(mockData);

      // Act
      const result = await service.getPointToTokenTransactions(query);

      // Assert
      expect(pointToTokenTxRepository.getWithPagination).toHaveBeenCalledWith(
        query,
      );
      expect(result.count).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].point_to_token_transaction_id).toBe(1);
    });
  });

  describe('getPointToTokenTransaction', () => {
    it('should return point to token transaction when found', async () => {
      // Arrange
      const transactionId = 1;
      pointToTokenTxRepository.findById.mockResolvedValue(
        mockPointToTokenTransaction as any,
      );

      // Act
      const result = await service.getPointToTokenTransaction(transactionId);

      // Assert
      expect(pointToTokenTxRepository.findById).toHaveBeenCalledWith(
        transactionId,
      );
      expect(result.point_to_token_transaction_id).toBe(1);
      expect(result.transaction_hash).toBe('0x123');
    });

    it('should throw NotFoundException when transaction not found', async () => {
      // Arrange
      const transactionId = 1;
      pointToTokenTxRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getPointToTokenTransaction(transactionId),
      ).rejects.toThrow(NotFoundException);
      expect(pointToTokenTxRepository.findById).toHaveBeenCalledWith(
        transactionId,
      );
    });
  });

  describe('processPointToTokenTransaction', () => {
    it('should process point to token transaction successfully', async () => {
      // Arrange
      const body = {
        transaction_hash: '0x123',
        event_logs: [
          {
            wallet_address: '0xabcdef',
            point_amount: '1000',
            token_amount: '500',
          },
        ],
      };
      const mockTransactions = [mockPointToTokenTransaction];

      pointToTokenTxRepository.findByTransactionHash.mockResolvedValue(
        mockTransactions as any,
      );
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });
      pointToTokenTxRepository.updateStatusByIds.mockResolvedValue(
        undefined as any,
      );
      swapService.updateSwapHistoryStatusByTokenMintHistoryIds.mockResolvedValue(
        undefined as any,
      );

      // Act
      const result = await service.processPointToTokenTransaction(body as any);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(
        pointToTokenTxRepository.findByTransactionHash,
      ).toHaveBeenCalledWith('0x123');
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Point to Token Transaction processed successfully',
      );
    });

    it('should return failure when no transactions found', async () => {
      // Arrange
      const body = {
        transaction_hash: '0x123',
        event_logs: [
          {
            wallet_address: '0xabcdef',
            point_amount: '1000',
            token_amount: '500',
          },
        ],
      };

      pointToTokenTxRepository.findByTransactionHash.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      // Act
      const result = await service.processPointToTokenTransaction(body as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'No Point to Token Transactions found for the given transaction hash',
      );
    });
  });

  describe('createPointToTokenTransactions', () => {
    it('should create point to token transaction', async () => {
      // Arrange
      const data = {
        transactionHash: '0x123',
        status: TokenStatus.PROCESSED,
        tokenAmount: '1000',
      };

      pointToTokenTxRepository.create.mockResolvedValue(
        mockPointToTokenTransaction as any,
      );

      // Act
      const result = await service.createPointToTokenTransactions(data as any);

      // Assert
      expect(pointToTokenTxRepository.create).toHaveBeenCalledWith(
        data,
        undefined,
      );
      expect(result.point_to_token_transaction_id).toBe(1);
      expect(result.amount).toBe('1000');
    });
  });

  describe('getTokenToPointTransactions', () => {
    it('should return paginated token to point transactions', async () => {
      // Arrange
      const query = {
        limit: 10,
        offset: 0,
      };
      const mockData = {
        data: [mockTokenToPointTransaction],
        total: 1,
      };
      tokenToPointTxRepository.getWithPagination.mockResolvedValue(mockData);

      // Act
      const result = await service.getTokenToPointTransactions(query);

      // Assert
      expect(tokenToPointTxRepository.getWithPagination).toHaveBeenCalledWith(
        query,
      );
      expect(result.count).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].token_to_point_transaction_id).toBe(1);
    });
  });

  describe('getTokenToPointTransaction', () => {
    it('should return token to point transaction when found', async () => {
      // Arrange
      const transactionId = 1;
      tokenToPointTxRepository.findById.mockResolvedValue(
        mockTokenToPointTransaction as any,
      );

      // Act
      const result = await service.getTokenToPointTransaction(transactionId);

      // Assert
      expect(tokenToPointTxRepository.findById).toHaveBeenCalledWith(
        transactionId,
      );
      expect(result.token_to_point_transaction_id).toBe(1);
      expect(result.transaction_hash).toBe('0x456');
    });

    it('should throw NotFoundException when transaction not found', async () => {
      // Arrange
      const transactionId = 1;
      tokenToPointTxRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getTokenToPointTransaction(transactionId),
      ).rejects.toThrow(NotFoundException);
      expect(tokenToPointTxRepository.findById).toHaveBeenCalledWith(
        transactionId,
      );
    });
  });

  describe('processTokenToPointTransaction', () => {
    const mockBody = {
      transaction_hash: '0x456',
      event_logs: [
        {
          wallet_address: '0xabcdef',
          point_amount: '1000',
          token_amount: '500',
        },
      ],
    };

    it('should process token to point transaction with existing transactions', async () => {
      // Arrange
      const mockTransactions = [mockTokenToPointTransaction];

      tokenToPointTxRepository.findByTransactionHash.mockResolvedValue(
        mockTransactions as any,
      );
      pointService.findUserByWalletAddress.mockResolvedValue(mockUser as any);
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });
      tokenToPointTxRepository.updateStatusByIds.mockResolvedValue(
        undefined as any,
      );
      swapService.updateSwapHistoryStatusByTokenBurnHistoryIds.mockResolvedValue(
        undefined as any,
      );
      rabbitmqService.sendPointUpdateBalance.mockReturnValue(undefined as any);

      // Act
      const result = await service.processTokenToPointTransaction(
        mockBody as any,
      );

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(
        tokenToPointTxRepository.findByTransactionHash,
      ).toHaveBeenCalledWith('0x456');
      expect(pointService.findUserByWalletAddress).toHaveBeenCalledWith(
        '0xabcdef',
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Token to Point Transaction processed successfully',
      );
    });

    it('should handle user not found scenario', async () => {
      // Arrange
      tokenToPointTxRepository.findByTransactionHash.mockResolvedValue([]);
      pointService.findUserByWalletAddress.mockResolvedValue(null);
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const result = await service.processTokenToPointTransaction(
        mockBody as any,
      );

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'User not found for wallet address: 0xabcdef',
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Token to Point Transaction processed successfully',
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle errors and return failure', async () => {
      // Arrange
      dataSource.transaction.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await service.processTokenToPointTransaction(
        mockBody as any,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Token to Point Transaction processed failed',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Token to Point Transaction processed failed',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('sendUserPointIncreaseMessage', () => {
    it('should send user point increase message successfully', () => {
      // Arrange
      const userId = 'user-123';
      const amount = BigInt(1000);
      rabbitmqService.sendPointUpdateBalance.mockReturnValue(undefined as any);

      // Act
      service.sendUserPointIncreaseMessage(userId, amount);

      // Assert
      expect(rabbitmqService.sendPointUpdateBalance).toHaveBeenCalledWith({
        userId: 'user-123',
        amount: '1000',
        type: UpdateUserPointBalanceType.INCREASE,
      });
    });

    it('should handle errors when sending message', () => {
      // Arrange
      const userId = 'user-123';
      const amount = BigInt(1000);
      rabbitmqService.sendPointUpdateBalance.mockImplementation(() => {
        throw new Error('RabbitMQ error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      service.sendUserPointIncreaseMessage(userId, amount);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'User Point Increase Message sent failed',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('createTokenToPointTransactions', () => {
    it('should create token to point transaction', async () => {
      // Arrange
      const data = {
        transactionHash: '0x456',
        status: TokenStatus.CONFIRMED,
        tokenAmount: '500',
      };

      tokenToPointTxRepository.create.mockResolvedValue(
        mockTokenToPointTransaction as any,
      );

      // Act
      const result = await service.createTokenToPointTransactions(data as any);

      // Assert
      expect(tokenToPointTxRepository.create).toHaveBeenCalledWith(
        data,
        undefined,
      );
      expect(result.token_to_point_transaction_id).toBe(1);
      expect(result.amount).toBe('2000');
    });
  });
});
