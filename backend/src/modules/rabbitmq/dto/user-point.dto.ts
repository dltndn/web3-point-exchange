import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  IsUUID,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UpdateUserPointBalanceType } from '../constants';

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

export class UpdateUserPointBalanceRmqDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: '포인트 증가 금액',
    example: '1000',
  })
  @Validate(IsBigIntString, {
    message: 'amount should be a valid bigint string',
  })
  @IsString()
  amount: string;

  @ApiProperty({
    description: '포인트 증가 유형',
    example: UpdateUserPointBalanceType.INCREASE,
  })
  @Type(() => Number)
  @IsNumber()
  type: UpdateUserPointBalanceType;
}
