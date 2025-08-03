import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import {
  connect as amqpConnect,
  Connection,
  Channel,
  Replies,
} from 'amqplib';
import { Config } from '../../config/environment/config';
import {
  POINT_SWAP_TRANSACTION_SERVICE,
  POINT_SWAP_TRANSACTION_QUEUE,
  POINT_UPDATE_BALANCE_SERVICE,
  POINT_UPDATE_BALANCE_QUEUE,
} from './constants';
import { PointSwapTransactioRmqDto } from './dto/point-swap-transaction.dto';
import { UpdateUserPointBalanceRmqDto } from './dto/user-point.dto';

/**
 * Interface for queue message with metadata
 */
export interface QueueMessage<T = any> {
  data: T;
  pattern: string;
  id?: string;
  timestamp?: Date;
}

/**
 * Interface for queue processing result
 */
export interface QueueProcessingResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Interface for queue status information
 */
export interface QueueStatusInfo {
  messageCount: number;
  consumerCount: number;
  queueName: string;
}

/**
 * RabbitMQ service for managing message queue operations
 */
@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);
  private readonly MESSAGE_TIMEOUT = 5000; // 5초 타임아웃

  constructor(
    @Inject(POINT_SWAP_TRANSACTION_SERVICE)
    private readonly pointSwapTransactionClient: ClientProxy,
    @Inject(POINT_UPDATE_BALANCE_SERVICE)
    private readonly pointUpdateBalanceClient: ClientProxy,
  ) {}

  /**
   * Send message to point swap transaction queue
   */
  sendPointSwapTransaction(data: PointSwapTransactioRmqDto): void {
    try {
      this.pointSwapTransactionClient.emit(POINT_SWAP_TRANSACTION_QUEUE, data);
      this.logger.log(
        `Message sent to ${POINT_SWAP_TRANSACTION_QUEUE}: ${JSON.stringify(data)}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message to ${POINT_SWAP_TRANSACTION_QUEUE}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send message to point update balance queue
   */
  sendPointUpdateBalance(data: UpdateUserPointBalanceRmqDto): void {
    try {
      this.pointUpdateBalanceClient.emit(POINT_UPDATE_BALANCE_QUEUE, data);
      this.logger.log(
        `Message sent to ${POINT_UPDATE_BALANCE_QUEUE}: ${JSON.stringify(data)}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message to ${POINT_UPDATE_BALANCE_QUEUE}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 1. Check messages in point swap transaction queue
   * 큐의 메시지를 확인 (소비하지 않음)
   */
  async checkPointSwapTransactionQueue(): Promise<QueueStatusInfo> {
    this.logger.log(
      `Checking ${POINT_SWAP_TRANSACTION_QUEUE} status via AMQP...`,
    );

    try {
      return await this.getQueueStatusByAmqp(POINT_SWAP_TRANSACTION_QUEUE);
    } catch (error) {
      this.logger.error(
        `Failed to check ${POINT_SWAP_TRANSACTION_QUEUE}: ${String(error)}`,
      );
      // 오류가 발생해도 스케줄러가 멈추지 않도록 기본값 반환
      return {
        queueName: POINT_SWAP_TRANSACTION_QUEUE,
        messageCount: 0,
        consumerCount: 0,
      };
    }
  }

  /**
   * 2. Process the oldest message from point swap transaction queue (FIFO)
   * 큐의 가장 앞 메시지를 하나씩 처리 (FIFO)
   * 처리 성공 시 큐에서 제거, 실패 시 큐에 그대로 유지
   */
  async processOldestPointSwapTransaction(
    processor: (data: PointSwapTransactioRmqDto) => Promise<boolean>,
  ): Promise<{
    processed: boolean;
    message?: PointSwapTransactioRmqDto;
    error?: string;
  }> {
    const env = Config.getEnvironment();
    const connectionUrl = `${env.RABBITMQ.PROTOCOL ?? 'amqp'}://${env.RABBITMQ.USER}:${env.RABBITMQ.PASSWORD}@${env.RABBITMQ.HOST}:${env.RABBITMQ.PORT}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let connection: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;

    try {
      this.logger.log(
        `Processing oldest message from ${POINT_SWAP_TRANSACTION_QUEUE}...`,
      );

      // AMQP 연결 생성
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      connection = await amqpConnect(connectionUrl);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      channel = await connection.createChannel();

      // 큐에서 메시지 하나 가져오기 (noAck: false로 수동 acknowledge 모드)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const msg: any = await channel.get(POINT_SWAP_TRANSACTION_QUEUE, {
        noAck: false,
      });

      if (!msg) {
        this.logger.log(
          `No messages available in ${POINT_SWAP_TRANSACTION_QUEUE}`,
        );
        return { processed: false };
      }

      // 메시지 데이터 파싱
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const messageContent: any = JSON.parse(msg.content.toString());

      // NestJS 마이크로서비스 형태의 메시지에서 실제 데이터 추출
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const data = messageContent.data as PointSwapTransactioRmqDto;

      this.logger.log(`Retrieved message from queue: ${JSON.stringify(data)}`);

      try {
        // 사용자 정의 처리 함수 실행
        const processingResult = await processor(data);

        if (processingResult) {
          // 처리 성공 - 메시지를 큐에서 제거 (acknowledge)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await channel.ack(msg);
          this.logger.log(`Successfully processed and acknowledged message`);

          return {
            processed: true,
            message: data,
          };
        } else {
          // 처리 실패 - 메시지를 큐에 다시 넣음 (negative acknowledge)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await channel.nack(msg, false, true); // requeue = true
          this.logger.warn(`Processing failed, message returned to queue`);

          return {
            processed: false,
            message: data,
            error: 'Processing function returned false',
          };
        }
      } catch (processingError) {
        // 처리 중 예외 발생 - 메시지를 큐에 다시 넣음
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await channel.nack(msg, false, true); // requeue = true
        const errorMessage = `Processing error: ${processingError}`;
        this.logger.error(errorMessage);

        return {
          processed: false,
          message: data,
          error: errorMessage,
        };
      }
    } catch (error) {
      const errorMessage = `Failed to process oldest message from ${POINT_SWAP_TRANSACTION_QUEUE}: ${error}`;
      this.logger.error(errorMessage);
      return {
        processed: false,
        error: errorMessage,
      };
    } finally {
      // 연결 정리
      try {
        if (channel) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await channel.close();
        }
        if (connection) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await connection.close();
        }
      } catch (closeError) {
        this.logger.warn(`Failed to close AMQP connection: ${closeError}`);
      }
    }
  }

  /**
   * Acknowledge message (remove from queue)
   * 메시지 확인 (큐에서 제거)
   * @deprecated 이제 processOldestPointSwapTransaction에서 직접 처리됩니다
   */
  private async acknowledgeMessage(deliveryTag: string): Promise<void> {
    try {
      const ack$ = this.pointSwapTransactionClient
        .send('message.ack', { deliveryTag })
        .pipe(
          timeout(this.MESSAGE_TIMEOUT),
          catchError((err: unknown) => {
            this.logger.error(`Failed to acknowledge message: ${String(err)}`);
            throw err;
          }),
        );

      await firstValueFrom(ack$);
      this.logger.debug(`Message acknowledged: ${deliveryTag}`);
    } catch (error) {
      this.logger.error(`Failed to acknowledge message ${deliveryTag}`, error);
      throw error;
    }
  }

  /**
   * Reject message (return to queue or discard)
   * 메시지 거부 (큐에 다시 넣거나 폐기)
   */
  private async rejectMessage(
    deliveryTag: string,
    requeue: boolean = true,
  ): Promise<void> {
    try {
      const reject$ = this.pointSwapTransactionClient
        .send('message.reject', { deliveryTag, requeue })
        .pipe(
          timeout(this.MESSAGE_TIMEOUT),
          catchError((err: unknown) => {
            this.logger.error(`Failed to reject message: ${String(err)}`);
            throw err;
          }),
        );

      await firstValueFrom(reject$);
      this.logger.debug(
        `Message rejected: ${deliveryTag}, requeue: ${requeue}`,
      );
    } catch (error) {
      this.logger.error(`Failed to reject message ${deliveryTag}`, error);
      throw error;
    }
  }

  /**
   * 실제 RabbitMQ 브로커에 직접 접속해 queue 정보를 조회한다.
   * amqplib 의 channel.checkQueue() 는 queue 가 존재하면 messageCount / consumerCount 를 반환한다.
   */
  private async getQueueStatusByAmqp(
    queueName: string,
  ): Promise<QueueStatusInfo> {
    const env = Config.getEnvironment();
    const connectionUrl = `${env.RABBITMQ.PROTOCOL ?? 'amqp'}://${env.RABBITMQ.USER}:${env.RABBITMQ.PASSWORD}@${env.RABBITMQ.HOST}:${env.RABBITMQ.PORT}`;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const connection: Connection = await amqpConnect(connectionUrl);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const channel: Channel = await connection.createChannel();
      try {
        const res: Replies.AssertQueue = await channel.assertQueue(queueName, {
          durable: true,
        });
        await channel.close();

        return {
          queueName: res.queue,
          messageCount: res.messageCount,
          consumerCount: res.consumerCount,
        };
      } catch (error: unknown) {
        this.logger.error(`checkQueue failed: ${String(error)}`);
        throw error;
      }
    } finally {
      await connection.close();
    }
  }
}
