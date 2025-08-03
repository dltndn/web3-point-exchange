import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class RedisConfig {
  @IsString()
  HOST: string;

  @Type(() => Number)
  @IsNumber()
  PORT: number;
}
