import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Cron } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

/**
 * Scheduler controller for managing scheduled tasks and queue processing
 */
@ApiTags('Scheduler')
@Controller('scheduler')
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  /**
   * Admin test endpoint for scheduler module
   * @returns Test response
   */
  @Get('admin/test')
  @ApiOperation({ summary: 'Scheduler module admin test' })
  @ApiResponse({ status: 200, description: 'Admin test response' })
  getAdminTest(): { message: string; timestamp: string } {
    return this.schedulerService.getAdminTest();
  }

  /**
   * 포인트 교환 트랜잭션 처리 (크론 작업)
   * 매 3초마다 실행
   */
  // 초(Seconds) 필드를 사용해 3초마다 실행되도록 수정
  @Cron('*/3 * * * * *')
  async handlePointSwapTransaction(): Promise<void> {
    await this.schedulerService.handlePointSwapTransaction();
  }

  /**
   * 큐 상태 조회 엔드포인트
   */
  @Get('queue/status')
  @ApiOperation({ summary: 'Get point swap transaction queue status' })
  @ApiResponse({ status: 200, description: 'Queue status information' })
  async getQueueStatus() {
    throw new Error('Not implemented');
    // return await this.schedulerService.monitorQueueStatus();
  }
}
