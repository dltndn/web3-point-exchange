import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TokenStatus } from '../constants';

export class GetTokenToPointTransactionsReqQueryDto {
  @ApiPropertyOptional({
    description: '트랜잭션 해시',
    example: 'transaction-hash-123',
  })
  @IsString()
  @IsOptional()
  transactionHash?: string;

  @ApiPropertyOptional({
    description: '상태 (1: PROCESSED, 2: CONFIRMED, 3: FINALIZED, 4: FAILED)',
    example: 2,
    enum: [1, 2, 3, 4],
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  status?: number;

  @ApiPropertyOptional({
    description: '마지막 ID',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lastId?: number;

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

export class PointWithdrawnEventLog {
  @ApiProperty({
    description: '지갑 주소',
    example: '0x123456789abcdef',
  })
  @IsString()
  wallet_address: string;

  @ApiProperty({
    description: '포인트 금액',
    example: '1000',
    type: 'string',
  })
  @IsString()
  point_amount: string;

  @ApiProperty({
    description: '토큰 금액',
    example: '1000',
    type: 'string',
  })
  @IsString()
  token_amount: string;
}

export class ProcessTokenToPointTransactionReqBodyDto {
  @ApiProperty({
    description: '트랜잭션 해시',
    example: 'transaction-hash-123',
  })
  @IsString()
  transaction_hash: string;

  @ApiProperty({
    description: '이벤트 로그',
    type: [PointWithdrawnEventLog],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointWithdrawnEventLog)
  event_logs: PointWithdrawnEventLog[];
}

export class CreateTokenToPointTransactionsDataDto {
  @ApiProperty({
    description: '트랜잭션 해시',
    example: '0x1234...',
  })
  @IsString()
  transactionHash: string;

  @ApiProperty({
    description: 'status',
    example: TokenStatus.PROCESSED,
  })
  @IsNumber()
  @Type(() => Number)
  status: TokenStatus;

  @ApiProperty({
    description: '토큰 금액',
    example: '1000',
    type: 'string',
  })
  @IsString()
  tokenAmount: string;
}

export class SuccessResDto {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  readonly success: boolean;

  @ApiPropertyOptional({
    description: '메시지',
    example: 'Transaction processed successfully',
  })
  readonly message?: string;
}

export class TokenToPointTransactionResDto {
  @ApiProperty({
    description: '토큰→포인트 트랜잭션 ID',
    example: 1,
  })
  readonly token_to_point_transaction_id: number;

  @ApiProperty({
    description: '트랜잭션 해시',
    example: 'transaction-hash-123',
  })
  readonly transaction_hash: string;

  @ApiProperty({
    description: '상태',
    example: 2,
  })
  readonly status: number;

  @ApiProperty({
    description: '트랜잭션 금액',
    example: '1000',
    type: 'string',
  })
  readonly amount: string;

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

export class TokenToPointTransactionListResDto {
  @ApiProperty({
    description: '전체 개수',
    example: 10,
  })
  readonly count: number;

  @ApiProperty({
    description: '토큰→포인트 트랜잭션 목록',
    type: [TokenToPointTransactionResDto],
  })
  readonly data: TokenToPointTransactionResDto[];
}
