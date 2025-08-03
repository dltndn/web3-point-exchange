import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PointService } from './point.service';
import {
  GetUserPointsReqQueryDto,
  CreateUserPointReqDto,
  UserPointResDto,
  UserPointListResDto,
  DepositPointsReqDto,
  WithdrawPointsReqDto,
  GetPointBalanceReqQueryDto,
  UserPointBalanceResDto,
  SuccessResDto,
  ValidateUserReqBodyDto,
  GetUserPointParamDto,
} from './dto/user-point.dto';
import {
  GetConsumptionHistoriesReqQueryDto,
  ConsumePointReqDto,
  ConsumptionHistoryResDto,
  ConsumptionHistoryListResDto,
  GetConsumptionHistoryParamDto,
  ConsumePointParamDto,
  RollbackConsumptionParamDto,
  GetConsumptionHistoriesParamDto,
} from './dto/consumption-history.dto';
import {
  GetGrantHistoriesReqQueryDto,
  GrantPointReqDto,
  GrantHistoryResDto,
  GrantHistoryListResDto,
  GetGrantHistoryParamDto,
  GetGrantHistoriesParamDto,
  GrantPointParamDto,
} from './dto/grant-history.dto';
import { UserSwapHistoryResDto } from '../swap/dto/user-swap-history.dto';
import { UpdateUserPointBalanceRmqDto } from '../rabbitmq/dto/user-point.dto';
import {
  POINT_UPDATE_BALANCE_QUEUE,
  UpdateUserPointBalanceType,
} from '../rabbitmq/constants';

@ApiTags('Point')
@Controller('api/point/v1')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  /**
   * 1.1 [GET] /api/point/v1/user-points
   * 사용자 포인트 목록 조회
   */
  @Get('user-points')
  @ApiOperation({ summary: '사용자 포인트 목록 조회' })
  @ApiResponse({ status: 200, type: UserPointListResDto })
  async getUserPoints(
    @Query() query: GetUserPointsReqQueryDto,
  ): Promise<UserPointListResDto> {
    return await this.pointService.getUserPoints(query);
  }

  /**
   * 1.2 [GET] /api/point/v1/user-points/:userPointId
   * 사용자 포인트 상세 조회
   */
  @Get('user-points/:userPointId')
  @ApiOperation({ summary: '사용자 포인트 상세 조회' })
  @ApiResponse({ status: 200, type: UserPointResDto })
  async getUserPoint(
    @Param() params: GetUserPointParamDto,
  ): Promise<UserPointResDto> {
    return await this.pointService.getUserPoint(params.userPointId);
  }

  /**
   * 1.3 [POST] /api/point/v1/user-points
   * 사용자 포인트 생성
   */
  @Post('user-points')
  @ApiOperation({ summary: '사용자 포인트 생성' })
  @ApiResponse({ status: 201, type: UserPointResDto })
  async createUserPoint(
    @Body() createUserPointDto: CreateUserPointReqDto,
  ): Promise<UserPointResDto> {
    return await this.pointService.createUserPoint(createUserPointDto);
  }

  /**
   * 1.4 [GET] /api/point/v1/user-points/:userPointId/consumption-histories
   * 사용자 포인트 소비 내역 조회
   */
  @Get('user-points/:userPointId/consumption-histories')
  @ApiOperation({ summary: '사용자 포인트 소비 내역 조회' })
  @ApiResponse({ status: 200, type: ConsumptionHistoryListResDto })
  async getConsumptionHistories(
    @Param() params: GetConsumptionHistoriesParamDto,
    @Query() query: GetConsumptionHistoriesReqQueryDto,
  ): Promise<ConsumptionHistoryListResDto> {
    return await this.pointService.getConsumptionHistories(
      params.userPointId,
      query,
    );
  }

  /**
   * 1.5 [GET] /api/point/v1/user-points/:userPointId/consumption-histories/:consumptionHistoryId
   * 사용자 포인트 소비 내역 상세 조회
   */
  @Get('user-points/:userPointId/consumption-histories/:consumptionHistoryId')
  @ApiOperation({ summary: '사용자 포인트 소비 내역 상세 조회' })
  @ApiResponse({ status: 200, type: ConsumptionHistoryResDto })
  async getConsumptionHistory(
    @Param() params: GetConsumptionHistoryParamDto,
  ): Promise<ConsumptionHistoryResDto> {
    return await this.pointService.getConsumptionHistory(
      params.userPointId,
      params.consumptionHistoryId,
    );
  }

  /**
   * 1.6 [POST] /api/point/v1/user-points/deposit-points
   * 포인트 입금
   */
  @Post('user-points/deposit-points')
  @ApiOperation({ summary: '포인트 입금' })
  @ApiResponse({ status: 201, type: UserSwapHistoryResDto })
  async depositPoints(
    @Body() depositPointsDto: DepositPointsReqDto,
  ): Promise<UserSwapHistoryResDto> {
    return await this.pointService.depositPoints(depositPointsDto);
  }

  /**
   * 1.7 [POST] /api/point/v1/user-points/withdraw-points
   * 포인트 출금
   */
  @Post('user-points/withdraw-points')
  @ApiOperation({ summary: '포인트 출금' })
  @ApiResponse({ status: 201, type: UserSwapHistoryResDto })
  async withdrawPoints(
    @Body() withdrawPointsDto: WithdrawPointsReqDto,
  ): Promise<UserSwapHistoryResDto> {
    return await this.pointService.withdrawPoints(withdrawPointsDto);
  }

  /**
   * 1.8 [POST] /api/point/v1/user-points/:userPointId/consume
   * 포인트 소비
   */
  @Post('user-points/:userPointId/consume')
  @ApiOperation({ summary: '포인트 소비' })
  @ApiResponse({ status: 201, type: ConsumptionHistoryResDto })
  async consumePoint(
    @Param() params: ConsumePointParamDto,
    @Body() consumePointDto: ConsumePointReqDto,
  ): Promise<ConsumptionHistoryResDto> {
    return await this.pointService.consumePoint(
      params.userPointId,
      consumePointDto,
    );
  }

  /**
   * 1.9 [POST] /api/point/v1/user-points/:userPointId/consumption-histories/:consumptionHistoryId/rollback
   * 포인트 소비 롤백
   */
  @Post(
    'user-points/:userPointId/consumption-histories/:consumptionHistoryId/rollback',
  )
  @ApiOperation({ summary: '포인트 소비 롤백' })
  @ApiResponse({ status: 200, type: ConsumptionHistoryResDto })
  async rollbackConsumption(
    @Param() params: RollbackConsumptionParamDto,
  ): Promise<ConsumptionHistoryResDto> {
    return await this.pointService.rollbackConsumption(
      params.userPointId,
      params.consumptionHistoryId,
    );
  }

  /**
   * 1.10 [GET] /api/point/v1/user-points/:userPointId/grant-histories
   * 사용자 포인트 지급 내역 조회
   */
  @Get('user-points/:userPointId/grant-histories')
  @ApiOperation({ summary: '사용자 포인트 지급 내역 조회' })
  @ApiResponse({ status: 200, type: GrantHistoryListResDto })
  async getGrantHistories(
    @Param() params: GetGrantHistoriesParamDto,
    @Query() query: GetGrantHistoriesReqQueryDto,
  ): Promise<GrantHistoryListResDto> {
    return await this.pointService.getGrantHistories(params.userPointId, query);
  }

  /**
   * 1.11 [GET] /api/point/v1/user-points/:userPointId/grant-histories/:grantHistoryId
   * 사용자 포인트 지급 내역 상세 조회
   */
  @Get('user-points/:userPointId/grant-histories/:grantHistoryId')
  @ApiOperation({ summary: '사용자 포인트 지급 내역 상세 조회' })
  @ApiResponse({ status: 200, type: GrantHistoryResDto })
  async getGrantHistory(
    @Param() params: GetGrantHistoryParamDto,
  ): Promise<GrantHistoryResDto> {
    return await this.pointService.getGrantHistory(
      params.userPointId,
      params.grantHistoryId,
    );
  }

  /**
   * 1.12 [POST] /api/point/v1/user-points/:userPointId/grant
   * 포인트 지급
   */
  @Post('user-points/:userPointId/grant')
  @ApiOperation({ summary: '포인트 지급' })
  @ApiResponse({ status: 201, type: GrantHistoryResDto })
  async grantPoint(
    @Param() params: GrantPointParamDto,
    @Body() grantPointDto: GrantPointReqDto,
  ): Promise<GrantHistoryResDto> {
    return await this.pointService.grantPoint(
      params.userPointId,
      grantPointDto,
    );
  }

  /**
   * 1.13 [POST] /api/point/v1/user-points/:userPointId/grant-histories/:grantHistoryId/rollback
   * 포인트 지급 롤백
   */
  @Post('user-points/:userPointId/grant-histories/:grantHistoryId/rollback')
  @ApiOperation({ summary: '포인트 지급 롤백' })
  @ApiResponse({ status: 200, type: GrantHistoryResDto })
  async rollbackGrant(
    @Param() params: GetGrantHistoryParamDto,
  ): Promise<GrantHistoryResDto> {
    return await this.pointService.rollbackGrant(
      params.userPointId,
      params.grantHistoryId,
    );
  }

  /**
   * 1.14 [GET] /api/point/v1/user-points/balance
   * 포인트 잔액 조회
   */
  @Get('user-points/balance')
  @ApiOperation({ summary: '포인트 잔액 조회' })
  @ApiResponse({ status: 200, type: UserPointBalanceResDto })
  async getPointBalance(
    @Query() query: GetPointBalanceReqQueryDto,
  ): Promise<UserPointBalanceResDto> {
    return await this.pointService.getPointBalance(query.userId);
  }

  /**
   * 1.15 [POST] /api/point/v1/user-points/validate-user
   * 사용자 검증
   */
  @Post('user-points/validate-user')
  @ApiOperation({ summary: '사용자 검증' })
  @ApiResponse({ status: 200, type: SuccessResDto })
  async validateUser(
    @Body() body: ValidateUserReqBodyDto,
  ): Promise<SuccessResDto> {
    return await this.pointService.validateUser(body);
  }

  /**
   * RabbitMQ 메시지 수신: 사용자 포인트 잔액 업데이트
   */
  @MessagePattern(POINT_UPDATE_BALANCE_QUEUE)
  async handleUpdateUserPointBalance(
    @Payload() data: UpdateUserPointBalanceRmqDto,
  ): Promise<void> {
    try {
      // 포인트 증가 처리
      if (data.type === UpdateUserPointBalanceType.INCREASE) {
        await this.pointService.increaseUserPointBalance(
          data.userId,
          data.amount,
        );
      } else if (data.type === UpdateUserPointBalanceType.DECREASE) {
        // TO-DO: 포인트 감소 로직 구현 필요
        console.warn(
          `Point decrease not implemented yet for user: ${data.userId}, amount: ${data.amount}`,
        );
      } else {
        console.error(`Unknown update type: ${String(data.type)}`);
      }
    } catch (error) {
      console.error(
        `Failed to process point update balance message: ${JSON.stringify(data)}`,
        error,
      );
      // TO-DO: 메시지 처리 실패 시 예외를 던지면 RabbitMQ가 메시지를 재처리하거나 DLQ로 보낼 수 있음
      throw error;
    }
  }
}
