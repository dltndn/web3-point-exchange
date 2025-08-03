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
import { ConsumptionType, ConsumptionStatus } from '../constants';

/**
 * 포인트 사용 내역 엔티티
 */
@Entity('consumption_history')
export class ConsumptionHistory {
  @ApiProperty({
    description: '소비 내역 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  consumption_history_id: string;

  @ApiProperty({
    description: '소비 금액',
    example: '1000',
    type: 'string',
  })
  @Column({ nullable: false, type: 'bigint' })
  amount: bigint;

  @ApiProperty({
    description: '소비 유형',
    example: ConsumptionType.SHOP_PURCHASE,
    enum: ConsumptionType,
  })
  @Column({
    nullable: false,
    type: 'enum',
    enum: ConsumptionType,
    default: ConsumptionType.EVENT_PARTICIPATION,
  })
  type: ConsumptionType;

  @ApiProperty({
    description: '상태',
    example: ConsumptionStatus.COMPLETED,
    enum: ConsumptionStatus,
  })
  @Column({
    nullable: false,
    type: 'enum',
    enum: ConsumptionStatus,
    default: ConsumptionStatus.PENDING,
  })
  status: ConsumptionStatus;

  @ApiProperty({
    description: '관련 엔티티 ID',
    example: 'order_123',
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

  @ManyToOne(() => UserPoint, (userPoint) => userPoint.consumption_histories)
  @JoinColumn({ name: 'user_point_id' })
  user_point: UserPoint;
}
