import { Injectable, Logger } from '@nestjs/common';
import { RedlockService } from '../redlock/redlock.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { SwapService } from '../swap/swap.service';
import { Config } from '../../config/environment/config';
import { SwapType, SwapStatus } from '../swap/constants';
import {
  HANDLE_POINT_LOCK_EXPIRE_TIME,
  HANDLE_POINT_SWAP_TRANSACTION_LOCK,
} from '../redlock/constants';
import {
  APPROPRIATE_GAS_PER_TRANSACTION,
  AVERAGE_GAS_PER_TRANSACTION,
  VALID_UNTIL_TIMESTAMP,
} from '../blockchain/constants';
import { PointSwapTransactioRmqDto } from '../rabbitmq/dto/point-swap-transaction.dto';

/**
 * Scheduler service for managing scheduled tasks
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly redlockService: RedlockService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly blockchainService: BlockchainService,
    private readonly swapService: SwapService,
  ) {}

  /**
   * Admin test method
   * @returns Test response with timestamp
   */
  getAdminTest(): { message: string; timestamp: string } {
    return {
      message: 'Scheduler module is working',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 포인트 교환 트랜잭션 처리
   * 추후 동적으로 변경 필요
   */
  async handlePointSwapTransaction(): Promise<void> {
    this.logger.log('handlePointSwapTransaction');

    try {
      await this.redlockService.executeWithLock(
        HANDLE_POINT_SWAP_TRANSACTION_LOCK,
        HANDLE_POINT_LOCK_EXPIRE_TIME,
        async () => {
          await this.processPointSwapTransactions();
        },
      );
    } catch {
      this.logger.warn(
        'Failed to acquire lock or lock already exists, skipping...',
      );
      return;
    }
  }

  private async processPointSwapTransactions(): Promise<void> {
    let beforeUsedSignatureNonce: number | null = null;
    let currentManagerIndex: number | null = null;
    const calldatas: string[] = [];
    const txDatas: {
      userSwapHistoryId: string;
      type: SwapType;
    }[] = [];
    const permitCalldatas: string[] = []; // 임시 처리

    while (true) {
      // 큐에서 메시지 조회
      const queueStatus =
        await this.rabbitmqService.checkPointSwapTransactionQueue();
      if (queueStatus.messageCount === 0) {
        this.logger.log('No messages in queue, breaking loop');
        break;
      }

      // 메시지 하나씩 처리
      const result =
        await this.rabbitmqService.processOldestPointSwapTransaction(
          async (data: PointSwapTransactioRmqDto) => {
            this.logger.log('processOldestPointSwapTransaction start', data);
            try {
              const processResult = await this.processTransactionMessage(
                data,
                beforeUsedSignatureNonce,
                currentManagerIndex,
                calldatas,
                permitCalldatas,
              );

              this.logger.log(
                'processOldestPointSwapTransaction end',
                processResult,
              );

              // 성공한 경우만 nonce 업데이트
              if (
                processResult.success &&
                processResult.newNonce !== undefined
              ) {
                beforeUsedSignatureNonce = processResult.newNonce;
              }
              if (
                processResult.success &&
                processResult.managerIndex !== undefined
              ) {
                currentManagerIndex = processResult.managerIndex;
              }

              if (processResult.success) {
                txDatas.push({
                  userSwapHistoryId: data.userSwapHistoryId,
                  type: data.type,
                });
              }

              return processResult.success;
            } catch (error) {
              this.logger.error(`Failed to process transaction: ${error}`);
              await this.swapService.updateSwapHistoryStatus(
                data.userSwapHistoryId,
                SwapStatus.FAILED,
              );
              return false;
            }
          },
        );

      if (!result.processed) {
        if (!result.message) {
          this.logger.log('No more messages to process');
          break;
        }
        this.logger.warn(`Failed to process message: ${result.error}`);
        continue;
      }

      // 가스 한도 체크 후 루프 종료 여부 결정
      if (calldatas.length > 0) {
        const calCalldatas = [...permitCalldatas, ...calldatas];
        try {
          const estimatedGas = await this.blockchainService.estimateGas(
            this.blockchainService.getMulticallCalldata(calCalldatas),
          );
          const gasLimit =
            APPROPRIATE_GAS_PER_TRANSACTION - AVERAGE_GAS_PER_TRANSACTION;

          if (Number(estimatedGas) > gasLimit) {
            this.logger.log('Gas limit reached, breaking loop');
            break;
          }
        } catch (error) {
          this.logger.error(`Gas estimation failed: ${error}`);
          break;
        }
      }
    }

    // permit calldata 처리(임시 처리)
    if (permitCalldatas.length > 0) {
      const currentRelayerIndex =
        await this.blockchainService.getCurrentRelayerIndex();

      // Promise.all로 permit 트랜잭션들을 병렬 처리
      const permitResults = await Promise.allSettled(
        permitCalldatas.map((calldata) =>
          this.blockchainService.sendPermitTransaction(
            calldata,
            currentRelayerIndex,
          ),
        ),
      );

      // 성공/실패 결과 로깅
      permitResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          this.logger.log(
            `Permit transaction ${index + 1} successful: ${result.value}`,
          );
        } else {
          this.logger.error(
            `Permit transaction ${index + 1} failed: ${result.reason}`,
          );
        }
      });

      const successfulPermits = permitResults.filter(
        (result) => result.status === 'fulfilled',
      ).length;

      this.logger.log(
        `Processed ${permitResults.length} permit transactions, ${successfulPermits} successful`,
      );
    }

    // 트랜잭션 전송
    if (calldatas.length > 0) {
      const currentRelayerIndex =
        await this.blockchainService.getCurrentRelayerIndex();

      try {
        const { rawTransaction, transactionHash } =
          await this.blockchainService.sendMulticallTransaction(
            calldatas,
            currentRelayerIndex,
          );

        await this.swapService.processSwapHistoryTransactions(
          transactionHash,
          txDatas,
        );

        await this.blockchainService.sendRawTransaction(rawTransaction);

        // Manager index 업데이트
        if (currentManagerIndex !== null) {
          const maxManagerCount = Config.getEnvironment().MAX_MANAGER_COUNT;
          const nextManagerIndex = (currentManagerIndex + 1) % maxManagerCount;
          await this.blockchainService.setCurrentManagerIndex(nextManagerIndex);
        }
        this.logger.log(
          `Successfully prepared multicall transaction with ${calldatas.length} calls`,
        );
      } catch (error) {
        this.logger.error(`Failed to send multicall transaction: ${error}`);
        // TODO: 에러 발생 시 복구 프로세스 추가
      }

      // Relayer index 업데이트
      const maxRelayerCount = Config.getEnvironment().MAX_RELAYER_COUNT;
      const nextRelayerIndex = (currentRelayerIndex + 1) % maxRelayerCount;
      await this.blockchainService.setCurrentRelayerIndex(nextRelayerIndex);
    }
  }

  private async processTransactionMessage(
    data: PointSwapTransactioRmqDto,
    beforeUsedSignatureNonce: number | null,
    currentManagerIndex: number | null,
    calldatas: string[],
    permitCalldatas: string[],
  ): Promise<{
    success: boolean;
    newNonce?: number;
    managerIndex?: number;
  }> {
    if (data.type === SwapType.POINT_TO_TOKEN) {
      return await this.processDepositPointTransaction(
        data,
        beforeUsedSignatureNonce,
        currentManagerIndex,
        calldatas,
      );
    } else if (data.type === SwapType.TOKEN_TO_POINT) {
      const result = await this.processWithdrawPointTransaction(
        data,
        calldatas,
        permitCalldatas,
      );
      return { success: result };
    }

    this.logger.error(`Unknown transaction type: ${data.type as number}`);
    return { success: false };
  }

  private async processDepositPointTransaction(
    data: PointSwapTransactioRmqDto,
    beforeUsedSignatureNonce: number | null,
    currentManagerIndex: number | null,
    calldatas: string[],
  ): Promise<{
    success: boolean;
    newNonce?: number;
    managerIndex?: number;
  }> {
    try {
      // Manager index 가져오기
      let resolvedManagerIndex = currentManagerIndex;
      if (resolvedManagerIndex === null) {
        resolvedManagerIndex =
          await this.blockchainService.getCurrentManagerIndex();
      }

      // EIP712 도메인 가져오기
      const domain = await this.blockchainService.getEip712Domain();

      // Signature nonce 계산
      let currentUsedSignatureNonce: number;
      if (beforeUsedSignatureNonce === null) {
        const managerAddress =
          this.blockchainService.getManagerAddress(resolvedManagerIndex);
        if (!managerAddress) {
          throw new Error(
            `Manager address not found for index: ${resolvedManagerIndex}`,
          );
        }

        const signatureNonce =
          await this.blockchainService.getSignatureNonce(managerAddress);
        currentUsedSignatureNonce = Number(signatureNonce);
      } else {
        currentUsedSignatureNonce = beforeUsedSignatureNonce + 1;
      }

      // Manager signature 생성
      const managerSignature =
        await this.blockchainService.getDepositPointManagerSignature(
          domain,
          data.walletAddress,
          data.amount,
          currentUsedSignatureNonce.toString(),
          resolvedManagerIndex,
        );

      // Calldata 생성
      const calldata = this.blockchainService.getDepositPointCalldata(
        data.walletAddress,
        data.amount,
        VALID_UNTIL_TIMESTAMP,
        resolvedManagerIndex,
        managerSignature,
      );

      // Gas estimation 체크
      const tempCalldatas = [...calldatas, calldata];
      const multicallCalldata =
        this.blockchainService.getMulticallCalldata(tempCalldatas);

      try {
        await this.blockchainService.estimateGas(multicallCalldata);
      } catch (error) {
        this.logger.error(`Gas estimation failed: ${error}`);
        // 유효하지 않은 트랜잭션 데이터 이므로 큐에서 제거
        // calldatas에 추가하지 않음
        await this.swapService.updateSwapHistoryStatus(
          data.userSwapHistoryId,
          SwapStatus.FAILED,
        );
        // nonce는 증가시키지 않음
        return { success: true };
      }

      // 성공적으로 처리됨
      calldatas.push(calldata);

      // nonce와 manager index 반환
      return {
        success: true,
        newNonce: currentUsedSignatureNonce,
        managerIndex: resolvedManagerIndex,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process deposit point transaction: ${error}`,
      );
      throw error;
    }
  }

  private async processWithdrawPointTransaction(
    data: PointSwapTransactioRmqDto,
    calldatas: string[],
    permitCalldatas: string[],
  ): Promise<boolean> {
    try {
      if (!data.signature || !data.validUntil) {
        throw new Error(
          'Signature and validUntil are required for withdraw transactions',
        );
      }

      if (data.permitData) {
        const permitCalldata = this.blockchainService.getPermitCalldata(
          data.permitData.owner,
          data.permitData.value,
          data.permitData.deadline,
          data.permitData.signature,
        );
        permitCalldatas.push(permitCalldata);
      }

      // Calldata 생성
      const calldata = this.blockchainService.getWithdrawPointCalldata(
        data.walletAddress,
        data.amount,
        data.validUntil,
        data.signature,
      );

      // Gas estimation 체크
      const tempCalldatas = [...calldatas, ...permitCalldatas, calldata];
      const multicallCalldata =
        this.blockchainService.getMulticallCalldata(tempCalldatas);
      try {
        await this.blockchainService.estimateGas(multicallCalldata);
      } catch (error) {
        this.logger.error(`Gas estimation failed: ${error}`);
        // 유효하지 않은 트랜잭션 데이터 이므로 큐에서 제거
        // calldatas에 추가하지 않음
        await this.swapService.updateSwapHistoryStatus(
          data.userSwapHistoryId,
          SwapStatus.FAILED,
        );
        return true;
      }

      // 성공적으로 처리됨
      calldatas.push(calldata);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process withdraw point transaction: ${error}`,
      );
      throw error;
    }
  }
}
