import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PointToTokenTransaction } from '../../token/entities/point-to-token-transaction.entity';
import { TokenToPointTransaction } from '../../token/entities/token-to-point-transaction.entity';
import { SwapType, SwapStatus } from '../constants';

/**
 * 사용자 교환 내역 엔티티
 */
@Entity('user_swap_history')
export class UserSwapHistory {
  @ApiProperty({
    description: '교환 내역 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  user_swap_history_id: string;

  @ApiProperty({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ nullable: false, type: 'varchar', length: 36 })
  user_id: string;

  @ApiProperty({
    description: '교환 유형',
    example: SwapType.POINT_TO_TOKEN,
    enum: SwapType,
  })
  @Column({
    nullable: false,
    type: 'enum',
    enum: SwapType,
    default: SwapType.POINT_TO_TOKEN,
  })
  type: SwapType;

  @ApiProperty({
    description: '포인트 금액',
    example: '1000',
    type: 'string',
  })
  @Column({ nullable: false, type: 'bigint' })
  amount_point: bigint;

  @ApiProperty({
    description: '토큰 금액',
    example: '1000',
    type: 'string',
  })
  @Column({ nullable: false, type: 'bigint' })
  amount_token: bigint;

  @ApiProperty({
    description: '상태',
    example: SwapStatus.COMPLETED,
    enum: SwapStatus,
  })
  @Column({
    nullable: false,
    type: 'enum',
    enum: SwapStatus,
    default: SwapStatus.PENDING,
  })
  status: SwapStatus;

  @ApiProperty({
    description: '토큰 민트 히스토리 ID',
    example: 1,
    required: false,
  })
  @Column({ nullable: true, type: 'int' })
  token_mint_history_id?: number;

  @ApiProperty({
    description: '토큰 번 히스토리 ID',
    example: 1,
    required: false,
  })
  @Column({ nullable: true, type: 'int' })
  token_burn_history_id?: number;

  @ApiProperty({
    description: '생성된 날짜',
    example: '2023-05-24T13:31:22.000Z',
  })
  @CreateDateColumn({
    nullable: false,
    type: 'timestamp',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: '마지막으로 업데이트된 날짜',
    example: '2023-05-24T13:31:22.000Z',
  })
  @UpdateDateColumn({
    nullable: true,
    type: 'timestamp',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(
    () => PointToTokenTransaction,
    (pointToTokenTransaction) => pointToTokenTransaction.user_swap_histories,
  )
  @JoinColumn({ name: 'token_mint_history_id' })
  point_to_token_transaction?: PointToTokenTransaction;

  @ManyToOne(
    () => TokenToPointTransaction,
    (tokenToPointTransaction) => tokenToPointTransaction.user_swap_histories,
  )
  @JoinColumn({ name: 'token_burn_history_id' })
  token_to_point_transaction?: TokenToPointTransaction;
}
