import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class RabbitMQConfig {
  @IsString()
  PROTOCOL: string;

  @IsString()
  HOST: string;

  @IsString()
  USER: string;

  @IsString()
  PASSWORD: string;

  @Type(() => Number)
  @IsNumber()
  PORT: number;
}
