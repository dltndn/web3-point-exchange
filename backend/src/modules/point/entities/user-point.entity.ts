import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConsumptionHistory } from './consumption-history.entity';
import { GrantHistory } from './grant-history.entity';

/**
 * 사용자 포인트 엔티티
 */
@Entity('user_point')
export class UserPoint {
  @ApiProperty({
    description: '포인트 ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  user_point_id: number;

  @ApiProperty({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ nullable: false, type: 'uuid', unique: true })
  user_id: string;

  @ApiProperty({
    description: '포인트 잔액',
    example: '1000',
    type: 'string',
  })
  @Column({ nullable: false, type: 'bigint', default: 0 })
  balance: bigint;

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
    () => ConsumptionHistory,
    (consumptionHistory) => consumptionHistory.user_point,
  )
  consumption_histories: ConsumptionHistory[];

  @OneToMany(() => GrantHistory, (grantHistory) => grantHistory.user_point)
  grant_histories: GrantHistory[];
}
