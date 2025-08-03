import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserSwapHistory } from '../../swap/entities/user-swap-history.entity';
import { TokenStatus } from '../constants';

/**
 * 토큰에서 포인트로 변환 트랜잭션 엔티티
 */
@Entity('token_to_point_transaction')
export class TokenToPointTransaction {
  @ApiProperty({
    description: '토큰에서 포인트로 변환 트랜잭션 ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  token_to_point_transaction_id: number;

  @ApiProperty({
    description: '트랜잭션 해시',
    example: '0x1234567890abcdef...',
    required: false,
  })
  @Column({ nullable: true, type: 'varchar' })
  transaction_hash?: string;

  @ApiProperty({
    description: '상태',
    example: TokenStatus.CONFIRMED,
    enum: TokenStatus,
  })
  @Column({
    nullable: false,
    type: 'enum',
    enum: TokenStatus,
    default: TokenStatus.PROCESSED,
  })
  status: TokenStatus;

  @ApiProperty({
    description: '금액',
    example: '1000',
    type: 'string',
  })
  @Column({ nullable: false, type: 'bigint' })
  amount: bigint;

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

  @OneToMany(
    () => UserSwapHistory,
    (userSwapHistory) => userSwapHistory.token_to_point_transaction,
  )
  user_swap_histories: UserSwapHistory[];
}
