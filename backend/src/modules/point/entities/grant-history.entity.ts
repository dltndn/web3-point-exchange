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
import { UserPoint } from './user-point.entity';
import { GrantType, GrantStatus } from '../constants';

/**
 * 포인트 지급 내역 엔티티
 */
@Entity('grant_history')
export class GrantHistory {
  @ApiProperty({
    description: '지급 내역 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  grant_history_id: string;

  @ApiProperty({
    description: '지급 금액',
    example: '1000',
    type: 'string',
  })
  @Column({ nullable: false, type: 'bigint' })
  amount: bigint;

  @ApiProperty({
    description: '지급 유형',
    example: GrantType.PURCHASE_REWARD,
    enum: GrantType,
  })
  @Column({
    nullable: false,
    type: 'enum',
    enum: GrantType,
    default: GrantType.PURCHASE_REWARD,
  })
  type: GrantType;

  @ApiProperty({
    description: '상태',
    example: GrantStatus.COMPLETED,
    enum: GrantStatus,
  })
  @Column({
    nullable: false,
    type: 'enum',
    enum: GrantStatus,
    default: GrantStatus.PENDING,
  })
  status: GrantStatus;

  @ApiProperty({
    description: '관련 엔티티 ID',
    example: 'event_123',
    required: false,
  })
  @Column({ nullable: true, type: 'varchar' })
  resource_id?: string;

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

  @ManyToOne(() => UserPoint, (userPoint) => userPoint.grant_histories)
  @JoinColumn({ name: 'user_point_id' })
  user_point: UserPoint;
}
