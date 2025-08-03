import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TokenService } from './token.service';
import {
  GetPointToTokenTransactionsReqQueryDto,
  PointToTokenTransactionResDto,
  PointToTokenTransactionListResDto,
  SuccessResDto,
  GetPointToTokenTransactionParamDto,
  GetTokenToPointTransactionParamDto,
  ProcessPointToTokenTransactionReqBodyDto,
} from './dto/point-to-token-transaction.dto';
import {
  GetTokenToPointTransactionsReqQueryDto,
  TokenToPointTransactionResDto,
  TokenToPointTransactionListResDto,
  ProcessTokenToPointTransactionReqBodyDto,
} from './dto/token-to-point-transaction.dto';

@ApiTags('Token')
@Controller('api/point/v1')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  /**
   * 3.1 [GET] /api/point/v1/point-to-token-transactions
   * 포인트에서 토큰으로 변환 트랜잭션 조회
   */
  @Get('point-to-token-transactions')
  @ApiOperation({ summary: '포인트에서 토큰으로 변환 트랜잭션 조회' })
  @ApiResponse({ status: 200, type: PointToTokenTransactionListResDto })
  async getPointToTokenTransactions(
    @Query() query: GetPointToTokenTransactionsReqQueryDto,
  ): Promise<PointToTokenTransactionListResDto> {
    return await this.tokenService.getPointToTokenTransactions(query);
  }

  /**
   * 3.2 [GET] /api/point/v1/point-to-token-transactions/:pointToTokenTransactionId
   * 포인트에서 토큰으로 변환 트랜잭션 상세 조회
   */
  @Get('point-to-token-transactions/:pointToTokenTransactionId')
  @ApiOperation({ summary: '포인트에서 토큰으로 변환 트랜잭션 상세 조회' })
  @ApiResponse({ status: 200, type: PointToTokenTransactionResDto })
  async getPointToTokenTransaction(
    @Param() params: GetPointToTokenTransactionParamDto,
  ): Promise<PointToTokenTransactionResDto> {
    return await this.tokenService.getPointToTokenTransaction(
      params.pointToTokenTransactionId,
    );
  }

  /**
   * 3.3 [POST] /api/point/v1/point-to-token-transactions/process
   * 포인트에서 토큰으로 변환 트랜잭션 생성
   */
  @Post('point-to-token-transactions/process')
  @ApiOperation({ summary: '포인트에서 토큰으로 변환 트랜잭션 생성' })
  @ApiResponse({ status: 201, type: SuccessResDto })
  async processPointToTokenTransaction(
    @Body() body: ProcessPointToTokenTransactionReqBodyDto,
  ): Promise<SuccessResDto> {
    return await this.tokenService.processPointToTokenTransaction(body);
  }

  /**
   * 4.1 [GET] /api/point/v1/token-to-point-transactions
   * 토큰에서 포인트로 변환 트랜잭션 조회
   */
  @Get('token-to-point-transactions')
  @ApiOperation({ summary: '토큰에서 포인트로 변환 트랜잭션 조회' })
  @ApiResponse({ status: 200, type: TokenToPointTransactionListResDto })
  async getTokenToPointTransactions(
    @Query() query: GetTokenToPointTransactionsReqQueryDto,
  ): Promise<TokenToPointTransactionListResDto> {
    return await this.tokenService.getTokenToPointTransactions(query);
  }

  /**
   * 4.2 [GET] /api/point/v1/token-to-point-transactions/:tokenToPointTransactionId
   * 토큰에서 포인트로 변환 트랜잭션 상세 조회
   */
  @Get('token-to-point-transactions/:tokenToPointTransactionId')
  @ApiOperation({ summary: '토큰에서 포인트로 변환 트랜잭션 상세 조회' })
  @ApiResponse({ status: 200, type: TokenToPointTransactionResDto })
  async getTokenToPointTransaction(
    @Param() params: GetTokenToPointTransactionParamDto,
  ): Promise<TokenToPointTransactionResDto> {
    return await this.tokenService.getTokenToPointTransaction(
      params.tokenToPointTransactionId,
    );
  }

  /**
   * 4.3 [POST] /api/point/v1/token-to-point-transactions/process
   * 토큰에서 포인트로 변환 트랜잭션 생성
   */
  @Post('token-to-point-transactions/process')
  @ApiOperation({ summary: '토큰에서 포인트로 변환 트랜잭션 생성' })
  @ApiResponse({ status: 201, type: SuccessResDto })
  async processTokenToPointTransaction(
    @Body() body: ProcessTokenToPointTransactionReqBodyDto,
  ): Promise<SuccessResDto> {
    return await this.tokenService.processTokenToPointTransaction(body);
  }
}
