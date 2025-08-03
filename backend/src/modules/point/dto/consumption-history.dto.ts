import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsUUID,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ConsumptionType } from '../constants';

/**
 * bigint 문자열 유효성 검사 커스텀 validator
 */
@ValidatorConstraint({ name: 'isBigIntString', async: false })
export class IsBigIntString implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      if (!value.trim()) {
        return true;
      }

      if (!/^-?\d+$/.test(value)) {
        return false;
      }

      BigInt(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'should be a valid bigint string';
  }
}

export class GetConsumptionHistoriesReqQueryDto {
  @ApiPropertyOptional({
    description: '소비 유형 (1: SHOP_PURCHASE, 2: EVENT_PARTICIPATION)',
    example: 1,
    enum: [1, 2],
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  type?: number;

  @ApiPropertyOptional({
    description: '상태 (1: PENDING, 2: COMPLETED, 3: FAILED)',
    example: 2,
    enum: [1, 2, 3],
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  status?: number;

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

/**
 * 소비 내역 조회 path parameter DTO
 */
export class GetConsumptionHistoriesParamDto {
  @ApiProperty({
    description: '사용자 포인트 ID',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  readonly userPointId: number;
}

export class ConsumePointReqDto {
  @ApiProperty({
    description: '소비할 포인트 양',
    example: '100',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(IsBigIntString, {
    message: 'amount should be a valid bigint string',
  })
  amount: string;

  @ApiProperty({
    description: '소비 유형 (1: SHOP_PURCHASE, 2: EVENT_PARTICIPATION)',
    example: ConsumptionType.SHOP_PURCHASE,
    enum: [ConsumptionType.SHOP_PURCHASE, ConsumptionType.EVENT_PARTICIPATION],
  })
  @IsNumber()
  @Type(() => Number)
  type: ConsumptionType;

  @ApiPropertyOptional({
    description: '관련 엔티티 ID',
    example: 'resource-123',
  })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'status 값을 무조건 Completed로 설정',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  force?: boolean;
}

/**
 * 포인트 소비 path parameter DTO
 */
export class ConsumePointParamDto {
  @ApiProperty({
    description: '사용자 포인트 ID',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  readonly userPointId: number;
}

/**
 * 소비 내역 롤백 path parameter DTO
 */
export class RollbackConsumptionParamDto {
  @ApiProperty({
    description: '사용자 포인트 ID',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  readonly userPointId: number;

  @ApiProperty({
    description: '소비 내역 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly consumptionHistoryId: string;
}

export class ConsumptionHistoryResDto {
  @ApiProperty({
    description: '소비 내역 ID',
    example: 'consumption-123',
  })
  readonly consumption_history_id: string;

  @ApiProperty({
    description: '사용자 포인트 ID',
    example: 1,
  })
  readonly user_point_id: number;

  @ApiProperty({
    description: '소비 금액',
    example: '100',
    type: 'string',
  })
  readonly amount: string;

  @ApiProperty({
    description: '소비 유형',
    example: 1,
  })
  readonly type: number;

  @ApiProperty({
    description: '상태',
    example: 2,
  })
  readonly status: number;

  @ApiProperty({
    description: '관련 엔티티 ID',
    example: 'resource-123',
  })
  readonly resource_id: string;

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

export class ConsumptionHistoryListResDto {
  @ApiProperty({
    description: '전체 개수',
    example: 10,
  })
  readonly count: number;

  @ApiProperty({
    description: '소비 내역 목록',
    type: [ConsumptionHistoryResDto],
  })
  readonly data: ConsumptionHistoryResDto[];
}

/**
 * 소비 내역 상세 조회 파라미터 DTO
 */
export class GetConsumptionHistoryParamDto {
  @ApiProperty({
    description: '사용자 포인트 ID',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  readonly userPointId: number;

  @ApiProperty({
    description: '소비 내역 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly consumptionHistoryId: string;
}
