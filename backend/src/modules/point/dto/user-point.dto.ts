import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsEthereumAddress,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  IsBoolean,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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

export class GetUserPointParamDto {
  @ApiProperty({
    description: '사용자 포인트 ID',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  readonly userPointId: number;
}

export class CreateUserPointReqDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: '지갑 주소',
    example: '0x123456789...',
  })
  @IsString()
  @IsEthereumAddress({
    message: '지갑 주소는 유효한 이더리움 주소여야 합니다.',
  })
  @IsOptional()
  walletAddress?: string;

  @ApiPropertyOptional({
    description: '초기 포인트 양',
    example: '1000',
    type: 'string',
  })
  @IsString()
  @Validate(IsBigIntString, {
    message: 'amount should be a valid bigint string',
  })
  @IsOptional()
  amount?: string;
}

export class GetUserPointsReqQueryDto {
  @ApiPropertyOptional({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class UserPointResDto {
  @ApiProperty({
    description: '포인트 ID',
    example: 1,
  })
  readonly user_point_id: number;

  @ApiProperty({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  readonly user_id: string;

  @ApiProperty({
    description: '포인트 잔액',
    example: '5000',
    type: 'string',
  })
  readonly balance: string;

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

export class UserPointListResDto {
  @ApiProperty({
    description: '전체 개수',
    example: 10,
  })
  readonly count: number;

  @ApiProperty({
    description: '사용자 포인트 목록',
    type: [UserPointResDto],
  })
  readonly data: UserPointResDto[];
}

export class DepositPointsReqDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: '지갑 주소',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsEthereumAddress({
    message: 'address should be a valid ethereum address',
  })
  walletAddress: string;

  @ApiProperty({
    description: '입금할 금액',
    example: '1000',
    type: 'string',
  })
  @IsString()
  @Validate(IsBigIntString, {
    message: 'amount should be a valid bigint string',
  })
  amount: string;
}

export class PermitDataDto {
  @ApiProperty({
    description: '소유자',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsEthereumAddress({
    message: 'address should be a valid ethereum address',
  })
  owner: string;

  @ApiProperty({
    description: '허용할 금액',
    example: '1000',
    type: 'string',
  })
  @IsString()
  @Validate(IsBigIntString, {
    message: 'amount should be a valid bigint string',
  })
  value: string;

  @ApiProperty({
    description: '만료 시간',
    example: 1716153600,
  })
  @IsNumber()
  @Type(() => Number)
  deadline: number;

  @ApiProperty({
    description: '서명',
    example:
      '0xabcdef1234567890abcdef123456890abcdef1234567890abcdef1234567890',
  })
  @IsString()
  signature: string;
}

export class WithdrawPointsReqDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: '지갑 주소',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsEthereumAddress({
    message: 'address should be a valid ethereum address',
  })
  walletAddress: string;

  @ApiProperty({
    description: '출금할 금액',
    example: '1000',
    type: 'string',
  })
  @IsString()
  @Validate(IsBigIntString, {
    message: 'amount should be a valid bigint string',
  })
  amount: string;

  @ApiProperty({
    description: '유효 기간',
    example: 1716153600,
  })
  @IsNumber()
  @Type(() => Number)
  validUntil: number;

  @ApiProperty({
    description: '서명',
    example:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  })
  @IsString()
  signature: string;

  @ApiPropertyOptional({
    description: 'ERC20 permit 데이터',
    type: PermitDataDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PermitDataDto)
  permitData?: PermitDataDto;
}

export class ValidateUserReqBodyDto {
  @ApiProperty({
    description: '지갑 주소',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsEthereumAddress({
    message: 'address should be a valid ethereum address',
  })
  walletAddress: string;

  @ApiProperty({
    description: '유효 여부',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  isValid: boolean;
}

/**
 * 포인트 잔액 조회 쿼리 DTO
 */
export class GetPointBalanceReqQueryDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly userId: string;
}

/**
 * 포인트 잔액 조회 응답 DTO
 */
export class UserPointBalanceResDto {
  @ApiProperty({
    description: '포인트 잔액',
    example: '1000',
  })
  readonly balance: string;
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

// API 명세에 따라 deposit-points와 withdraw-points는 UserSwapHistoryResDto를 반환
export { UserSwapHistoryResDto } from '../../swap/dto/user-swap-history.dto';
