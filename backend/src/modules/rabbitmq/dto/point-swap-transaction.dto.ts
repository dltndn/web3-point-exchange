import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SwapType } from '../../swap/constants';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PermitDataDto } from 'src/modules/point/dto/user-point.dto';

export class PointSwapTransactioRmqDto {
  @ApiProperty({
    description: '교환 내역 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userSwapHistoryId: string;

  @ApiProperty({
    description: '지갑 주소',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  walletAddress: string;

  @ApiProperty({
    description: '포인트 거래 금액',
  })
  amount: string;

  @ApiProperty({
    description: '포인트 거래 유형',
    example: SwapType.POINT_TO_TOKEN,
    enum: SwapType,
  })
  type: SwapType;

  @ApiPropertyOptional({
    description: '서명 값',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({
    description: '유효 기간',
    example: 1716153600,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  validUntil?: number;

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

export class ManagerAccountRmqDto {
  @ApiProperty({
    description: '이더리움 주소',
    example: '0x123456789...',
  })
  @IsString()
  managerAddress: string;

  @ApiProperty({
    description: 'index',
    example: 0,
  })
  @IsNumber()
  index: number;
}

export class RelayerAccountRmqDto {
  @ApiProperty({
    description: '이더리움 주소',
    example: '0x123456789...',
  })
  @IsString()
  relayerAddress: string;

  @ApiProperty({
    description: 'index',
    example: 0,
  })
  @IsNumber()
  index: number;
}
