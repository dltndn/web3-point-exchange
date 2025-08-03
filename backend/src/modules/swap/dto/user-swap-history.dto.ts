import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SwapStatus, SwapType } from '../constants';

export class GetUserSwapHistoriesReqQueryDto {
  @ApiPropertyOptional({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: '교환 유형 (1: POINT_TO_TOKEN, 2: TOKEN_TO_POINT)',
    example: SwapType.POINT_TO_TOKEN,
    enum: SwapType,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  type?: SwapType;

  @ApiPropertyOptional({
    description: '상태 (1: PENDING, 2: COMPLETED, 3: FAILED)',
    example: SwapStatus.COMPLETED,
    enum: SwapStatus,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  status?: SwapStatus;

  @ApiPropertyOptional({
    description: '마지막 ID',
    example: 'last-id-123',
  })
  @IsString()
  @IsOptional()
  lastId?: string;

  @ApiPropertyOptional({
    description: '가져올 항목 수',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: '오프셋',
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;

  @ApiPropertyOptional({
    description: '정렬 방향',
    example: 'DESC',
  })
  @IsString()
  @IsOptional()
  order?: string;
}

export class UserSwapHistoryResDto {
  @ApiProperty({
    description: '교환 내역 ID',
    example: 'swap-123',
  })
  readonly user_swap_history_id: string;

  @ApiProperty({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  readonly user_id: string;

  @ApiProperty({
    description: '교환 유형',
    example: 1,
  })
  readonly type: number;

  @ApiProperty({
    description: '포인트 금액',
    example: '1000',
    type: 'string',
  })
  readonly amount_point: string;

  @ApiProperty({
    description: '토큰 금액',
    example: '1000',
    type: 'string',
  })
  readonly amount_token: string;

  @ApiProperty({
    description: '상태',
    example: 2,
  })
  readonly status: number;

  @ApiPropertyOptional({
    description: '포인트→토큰 트랜잭션 ID',
    example: 1,
  })
  readonly point_to_token_transaction_id?: number;

  @ApiPropertyOptional({
    description: '토큰→포인트 트랜잭션 ID',
    example: 1,
  })
  readonly token_to_point_transaction_id?: number;

  @ApiProperty({
    description: '생성 날짜',
    example: '2024-01-01T00:00:00.000Z',
  })
  readonly created_at: string;

  @ApiProperty({
    description: '수정 날짜',
    example: '2024-01-01T00:00:00.000Z',
  })
  readonly updated_at: string;
}

export class UserSwapHistoryListResDto {
  @ApiProperty({
    description: '전체 개수',
    example: 10,
  })
  readonly count: number;

  @ApiProperty({
    description: '교환 내역 목록',
    type: [UserSwapHistoryResDto],
  })
  readonly data: UserSwapHistoryResDto[];
}

/**
 * 사용자 교환 내역 상세 조회 파라미터 DTO
 */
export class GetUserSwapHistoryParamDto {
  @ApiProperty({
    description: '교환 내역 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly userSwapHistoryId: string;
}
