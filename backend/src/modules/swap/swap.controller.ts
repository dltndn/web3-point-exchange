import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SwapService } from './swap.service';
import {
  GetUserSwapHistoriesReqQueryDto,
  GetUserSwapHistoryParamDto,
  UserSwapHistoryResDto,
  UserSwapHistoryListResDto,
} from './dto/user-swap-history.dto';

@ApiTags('Swap')
@Controller('api/point/v1')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  /**
   * 2.1 [GET] /api/point/v1/user-swap-histories
   * 사용자 교환 내역 조회
   */
  @Get('user-swap-histories')
  @ApiOperation({ summary: '사용자 교환 내역 조회' })
  @ApiResponse({ status: 200, type: UserSwapHistoryListResDto })
  async getUserSwapHistories(
    @Query() query: GetUserSwapHistoriesReqQueryDto,
  ): Promise<UserSwapHistoryListResDto> {
    return this.swapService.getUserSwapHistories(query);
  }

  /**
   * 2.2 [GET] /api/point/v1/user-swap-histories/:userSwapHistoryId
   * 사용자 교환 내역 상세 조회
   */
  @Get('user-swap-histories/:userSwapHistoryId')
  @ApiOperation({ summary: '사용자 교환 내역 상세 조회' })
  @ApiResponse({ status: 200, type: UserSwapHistoryResDto })
  async getUserSwapHistory(
    @Param() params: GetUserSwapHistoryParamDto,
  ): Promise<UserSwapHistoryResDto> {
    return this.swapService.getUserSwapHistory(params.userSwapHistoryId);
  }
}
