import { Test, TestingModule } from '@nestjs/testing';
import { SwapService } from './swap.service';
import { UserSwapHistoryRepository } from './repositories/user-swap-history.repository';
import { TokenService } from '../token/token.service';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SwapStatus, SwapType } from './constants';
import { TokenStatus } from '../token/constants';

describe('SwapService', () => {
  let service: SwapService;
  let userSwapHistoryRepository: jest.Mocked<UserSwapHistoryRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockUserSwapHistory = {
    user_swap_history_id: 'swap-123',
    user_id: 'user-123',
    type: SwapType.POINT_TO_TOKEN,
    amount_point: BigInt(1000),
    amount_token: BigInt(500),
    status: SwapStatus.COMPLETED,
    token_mint_history_id: 1,
    token_burn_history_id: undefined,
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    point_to_token_transaction: {
      point_to_token_transaction_id: 1,
    },
    token_to_point_transaction: undefined,
  };

  const mockPointToTokenTransaction = {
    point_to_token_transaction_id: 1,
    transaction_hash: '0x123',
    status: TokenStatus.PROCESSED,
    amount: BigInt(500),
  };

  const mockTokenToPointTransaction = {
    token_to_point_transaction_id: 2,
    transaction_hash: '0x456',
    status: TokenStatus.PROCESSED,
    amount: BigInt(1000),
  };

  beforeEach(async () => {
    const mockUserSwapHistoryRepository = {
      getWithPagination: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockTokenService = {
      createPointToTokenTransactions: jest.fn(),
      createTokenToPointTransactions: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapService,
        {
          provide: UserSwapHistoryRepository,
          useValue: mockUserSwapHistoryRepository,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SwapService>(SwapService);
    userSwapHistoryRepository = module.get(UserSwapHistoryRepository);
    tokenService = module.get(TokenService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserSwapHistories', () => {
    it('should return paginated user swap histories', async () => {
      // Arrange
      const query = {
        limit: 10,
        offset: 0,
      };
      const mockData = {
        data: [mockUserSwapHistory],
        total: 1,
      };
      userSwapHistoryRepository.getWithPagination.mockResolvedValue(
        mockData as any,
      );

      // Act
      const result = await service.getUserSwapHistories(query);

      // Assert
      expect(userSwapHistoryRepository.getWithPagination).toHaveBeenCalledWith(
        query,
      );
      expect(result.count).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_swap_history_id).toBe('swap-123');
      expect(result.data[0].amount_point).toBe('1000');
      expect(result.data[0].amount_token).toBe('500');
    });
  });

  describe('getUserSwapHistory', () => {
    it('should return user swap history when found', async () => {
      // Arrange
      const userSwapHistoryId = 'swap-123';
      userSwapHistoryRepository.findById.mockResolvedValue(
        mockUserSwapHistory as any,
      );

      // Act
      const result = await service.getUserSwapHistory(userSwapHistoryId);

      // Assert
      expect(userSwapHistoryRepository.findById).toHaveBeenCalledWith(
        userSwapHistoryId,
      );
      expect(result.user_swap_history_id).toBe('swap-123');
      expect(result.user_id).toBe('user-123');
      expect(result.type).toBe(SwapType.POINT_TO_TOKEN);
    });

    it('should throw NotFoundException when swap history not found', async () => {
      // Arrange
      const userSwapHistoryId = 'swap-123';
      userSwapHistoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getUserSwapHistory(userSwapHistoryId),
      ).rejects.toThrow(NotFoundException);
      expect(userSwapHistoryRepository.findById).toHaveBeenCalledWith(
        userSwapHistoryId,
      );
    });
  });

  describe('updateSwapHistoryById', () => {
    it('should update swap history successfully', async () => {
      // Arrange
      const userSwapHistoryId = 'swap-123';
      const updateData = { status: SwapStatus.COMPLETED };
      const updatedSwapHistory = {
        ...mockUserSwapHistory,
        ...updateData,
      };

      userSwapHistoryRepository.update.mockResolvedValue(
        updatedSwapHistory as any,
      );

      // Act
      const result = await service.updateSwapHistoryById(
        userSwapHistoryId,
        updateData,
      );

      // Assert
      expect(userSwapHistoryRepository.update).toHaveBeenCalledWith(
        userSwapHistoryId,
        updateData,
        undefined,
      );
      expect(result?.status).toBe(SwapStatus.COMPLETED);
    });

    it('should throw NotFoundException when swap history not found for update', async () => {
      // Arrange
      const userSwapHistoryId = 'swap-123';
      const updateData = { status: SwapStatus.COMPLETED };

      userSwapHistoryRepository.update.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateSwapHistoryById(userSwapHistoryId, updateData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSwapHistoryStatus', () => {
    it('should update swap history status', async () => {
      // Arrange
      const userSwapHistoryId = 'swap-123';
      const status = SwapStatus.COMPLETED;

      userSwapHistoryRepository.updateStatus.mockResolvedValue(undefined);

      // Act
      await service.updateSwapHistoryStatus(userSwapHistoryId, status);

      // Assert
      expect(userSwapHistoryRepository.updateStatus).toHaveBeenCalledWith(
        userSwapHistoryId,
        status,
      );
    });
  });

  describe('updateSwapHistoryStatusByTokenMintHistoryIds', () => {
    it('should update swap history status by token mint history ids', async () => {
      // Arrange
      const tokenMintHistoryIds = [1, 2];
      const status = SwapStatus.COMPLETED;
      const mockSwapHistories = {
        data: [
          { ...mockUserSwapHistory, token_mint_history_id: 1 },
          { ...mockUserSwapHistory, token_mint_history_id: 2 },
        ],
        total: 2,
      };

      userSwapHistoryRepository.getWithPagination.mockResolvedValue(
        mockSwapHistories as any,
      );
      userSwapHistoryRepository.updateStatus.mockResolvedValue(undefined);

      // Act
      await service.updateSwapHistoryStatusByTokenMintHistoryIds(
        tokenMintHistoryIds,
        status,
      );

      // Assert
      expect(userSwapHistoryRepository.getWithPagination).toHaveBeenCalledWith({
        limit: 1000,
      });
      expect(userSwapHistoryRepository.updateStatus).toHaveBeenCalledTimes(2);
    });

    it('should return early when no token mint history ids provided', async () => {
      // Arrange
      const tokenMintHistoryIds: number[] = [];
      const status = SwapStatus.COMPLETED;

      // Act
      await service.updateSwapHistoryStatusByTokenMintHistoryIds(
        tokenMintHistoryIds,
        status,
      );

      // Assert
      expect(
        userSwapHistoryRepository.getWithPagination,
      ).not.toHaveBeenCalled();
    });
  });

  describe('updateSwapHistoryStatusByTokenBurnHistoryIds', () => {
    it('should update swap history status by token burn history ids', async () => {
      // Arrange
      const tokenBurnHistoryIds = [1, 2];
      const status = SwapStatus.COMPLETED;
      const mockSwapHistories = {
        data: [
          { ...mockUserSwapHistory, token_burn_history_id: 1 },
          { ...mockUserSwapHistory, token_burn_history_id: 2 },
        ],
        total: 2,
      };

      userSwapHistoryRepository.getWithPagination.mockResolvedValue(
        mockSwapHistories as any,
      );
      userSwapHistoryRepository.updateStatus.mockResolvedValue(undefined);

      // Act
      await service.updateSwapHistoryStatusByTokenBurnHistoryIds(
        tokenBurnHistoryIds,
        status,
      );

      // Assert
      expect(userSwapHistoryRepository.getWithPagination).toHaveBeenCalledWith({
        limit: 1000,
      });
      expect(userSwapHistoryRepository.updateStatus).toHaveBeenCalledTimes(2);
    });

    it('should return early when no token burn history ids provided', async () => {
      // Arrange
      const tokenBurnHistoryIds: number[] = [];
      const status = SwapStatus.COMPLETED;

      // Act
      await service.updateSwapHistoryStatusByTokenBurnHistoryIds(
        tokenBurnHistoryIds,
        status,
      );

      // Assert
      expect(
        userSwapHistoryRepository.getWithPagination,
      ).not.toHaveBeenCalled();
    });
  });

  describe('processSwapHistoryTransactions', () => {
    it('should process point to token swap transactions', async () => {
      // Arrange
      const transactionHash = '0x123';
      const datas = [
        {
          userSwapHistoryId: 'swap-123',
          type: SwapType.POINT_TO_TOKEN,
        },
      ];
      const pendingSwapHistory = {
        ...mockUserSwapHistory,
        status: SwapStatus.PENDING,
      };

      userSwapHistoryRepository.findById.mockResolvedValue(
        pendingSwapHistory as any,
      );
      tokenService.createPointToTokenTransactions.mockResolvedValue(
        mockPointToTokenTransaction as any,
      );
      userSwapHistoryRepository.update.mockResolvedValue(
        mockUserSwapHistory as any,
      );
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      // Act
      await service.processSwapHistoryTransactions(transactionHash, datas);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(tokenService.createPointToTokenTransactions).toHaveBeenCalledWith(
        {
          transactionHash,
          status: TokenStatus.PROCESSED,
          tokenAmount: pendingSwapHistory.amount_token.toString(),
        },
        {},
      );
    });

    it('should process token to point swap transactions', async () => {
      // Arrange
      const transactionHash = '0x456';
      const datas = [
        {
          userSwapHistoryId: 'swap-123',
          type: SwapType.TOKEN_TO_POINT,
        },
      ];
      const pendingSwapHistory = {
        ...mockUserSwapHistory,
        type: SwapType.TOKEN_TO_POINT,
        status: SwapStatus.PENDING,
      };

      userSwapHistoryRepository.findById.mockResolvedValue(
        pendingSwapHistory as any,
      );
      tokenService.createTokenToPointTransactions.mockResolvedValue(
        mockTokenToPointTransaction as any,
      );
      userSwapHistoryRepository.update.mockResolvedValue(
        mockUserSwapHistory as any,
      );
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      // Act
      await service.processSwapHistoryTransactions(transactionHash, datas);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(tokenService.createTokenToPointTransactions).toHaveBeenCalledWith(
        {
          transactionHash,
          status: TokenStatus.PROCESSED,
          tokenAmount: pendingSwapHistory.amount_point.toString(),
        },
        {},
      );
    });

    it('should skip processing when swap history not found', async () => {
      // Arrange
      const transactionHash = '0x123';
      const datas = [
        {
          userSwapHistoryId: 'swap-123',
          type: SwapType.POINT_TO_TOKEN,
        },
      ];

      userSwapHistoryRepository.findById.mockResolvedValue(null);
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      // Act
      await service.processSwapHistoryTransactions(transactionHash, datas);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(
        tokenService.createPointToTokenTransactions,
      ).not.toHaveBeenCalled();
    });

    it('should skip processing when swap history status is not pending', async () => {
      // Arrange
      const transactionHash = '0x123';
      const datas = [
        {
          userSwapHistoryId: 'swap-123',
          type: SwapType.POINT_TO_TOKEN,
        },
      ];
      const completedSwapHistory = {
        ...mockUserSwapHistory,
        status: SwapStatus.COMPLETED,
      };

      userSwapHistoryRepository.findById.mockResolvedValue(
        completedSwapHistory as any,
      );
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      // Act
      await service.processSwapHistoryTransactions(transactionHash, datas);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(
        tokenService.createPointToTokenTransactions,
      ).not.toHaveBeenCalled();
    });
  });

  describe('createUserSwapHistory', () => {
    it('should create user swap history with default pending status', async () => {
      // Arrange
      const userId = 'user-123';
      const type = SwapType.POINT_TO_TOKEN;
      const amountPoint = BigInt(1000);
      const amountToken = BigInt(500);

      userSwapHistoryRepository.create.mockResolvedValue(
        mockUserSwapHistory as any,
      );

      // Act
      const result = await service.createUserSwapHistory(
        userId,
        type,
        amountPoint,
        amountToken,
      );

      // Assert
      expect(userSwapHistoryRepository.create).toHaveBeenCalledWith(
        userId,
        type,
        amountPoint,
        amountToken,
        SwapStatus.PENDING,
        undefined,
      );
      expect(result.user_id).toBe('user-123');
      expect(result.type).toBe(SwapType.POINT_TO_TOKEN);
    });

    it('should create user swap history with specified status', async () => {
      // Arrange
      const userId = 'user-123';
      const type = SwapType.TOKEN_TO_POINT;
      const amountPoint = BigInt(2000);
      const amountToken = BigInt(1000);
      const status = SwapStatus.COMPLETED;

      userSwapHistoryRepository.create.mockResolvedValue(
        mockUserSwapHistory as any,
      );

      // Act
      const result = await service.createUserSwapHistory(
        userId,
        type,
        amountPoint,
        amountToken,
        status,
      );

      // Assert
      expect(userSwapHistoryRepository.create).toHaveBeenCalledWith(
        userId,
        type,
        amountPoint,
        amountToken,
        status,
        undefined,
      );
      expect(result.user_id).toBe('user-123');
    });

    it('should create user swap history with entity manager', async () => {
      // Arrange
      const userId = 'user-123';
      const type = SwapType.POINT_TO_TOKEN;
      const amountPoint = BigInt(1000);
      const amountToken = BigInt(500);
      const entityManager = {} as any;

      userSwapHistoryRepository.create.mockResolvedValue(
        mockUserSwapHistory as any,
      );

      // Act
      const result = await service.createUserSwapHistory(
        userId,
        type,
        amountPoint,
        amountToken,
        SwapStatus.PENDING,
        entityManager,
      );

      // Assert
      expect(userSwapHistoryRepository.create).toHaveBeenCalledWith(
        userId,
        type,
        amountPoint,
        amountToken,
        SwapStatus.PENDING,
        entityManager,
      );
      expect(result.user_id).toBe('user-123');
    });
  });
});
