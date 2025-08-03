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
import { TokenStatus } from '../../token/constants';

/**
 * 포인트에서 토큰으로 변환 트랜잭션 엔티티
 */
@Entity('point_to_token_transaction')
export class PointToTokenTransaction {
  @ApiProperty({
    description: '포인트에서 토큰으로 변환 트랜잭션 ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  point_to_token_transaction_id: number;

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
    (userSwapHistory) => userSwapHistory.point_to_token_transaction,
  )
  user_swap_histories: UserSwapHistory[];
}
