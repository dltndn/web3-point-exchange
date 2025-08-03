import { Type, plainToClass } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { RedisConfig } from './configs/redis.config';
import { RabbitMQConfig } from './configs/rabbitmq.config';
import { DatabaseConfig } from './configs/database.config';

export class Environment {
  @IsString()
  NODE_ENV: string;

  @Type(() => Number)
  @IsNumber()
  SERVER_PORT = process.env?.SERVER_PORT
    ? Number(process.env.SERVER_PORT)
    : 3000;

  @ValidateNested()
  @Type(() => RedisConfig)
  REDIS: RedisConfig = plainToClass(RedisConfig, {
    HOST: process.env?.REDIS_HOST,
    PORT: process.env?.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  });

  @ValidateNested()
  @Type(() => RabbitMQConfig)
  RABBITMQ: RabbitMQConfig = plainToClass(RabbitMQConfig, {
    PROTOCOL: process.env?.RABBITMQ_PROTOCOL,
    HOST: process.env?.RABBITMQ_HOST,
    USER: process.env?.RABBITMQ_USER,
    PASSWORD: process.env?.RABBITMQ_PASSWORD,
    PORT: process.env?.RABBITMQ_PORT ? Number(process.env.RABBITMQ_PORT) : 5672,
  });

  @ValidateNested()
  @Type(() => DatabaseConfig)
  DATABASE: DatabaseConfig = plainToClass(DatabaseConfig, {
    type: 'postgres',
    host: process.env?.DATABASE_HOST,
    port: process.env?.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
    username: process.env?.DATABASE_USER,
    password: process.env?.DATABASE_PASSWORD,
    database: process.env?.DATABASE_NAME,
    synchronize: process.env?.NODE_ENV === 'development',
  });

  @Type(() => Number)
  @IsNumber()
  POINT_TOKEN_EXCHANGE_RATE = process.env?.POINT_TOKEN_EXCHANGE_RATE
    ? Number(process.env.POINT_TOKEN_EXCHANGE_RATE)
    : 100; // 100 -> 100 point = 1 token

  @IsString()
  POINT_MANAGER_CONTRACT_ADDRESS = process.env?.POINT_MANAGER_CONTRACT_ADDRESS;

  @IsString()
  BASE_SEPOLIA_RPC_URL = process.env?.BASE_SEPOLIA_RPC_URL;

  @IsString()
  MANAGER_WALLET1_ADDRESS = process.env?.MANAGER_WALLET1_ADDRESS;

  @IsString()
  MANAGER_WALLET1_PRIVATE_KEY = process.env?.MANAGER_WALLET1_PRIVATE_KEY;

  @IsString()
  MANAGER_WALLET2_ADDRESS = process.env?.MANAGER_WALLET2_ADDRESS;

  @IsString()
  MANAGER_WALLET2_PRIVATE_KEY = process.env?.MANAGER_WALLET2_PRIVATE_KEY;

  @IsString()
  MANAGER_WALLET3_ADDRESS = process.env?.MANAGER_WALLET3_ADDRESS;

  @IsString()
  MANAGER_WALLET3_PRIVATE_KEY = process.env?.MANAGER_WALLET3_PRIVATE_KEY;

  @IsString()
  RELAYER_WALLET1_ADDRESS = process.env?.RELAYER_WALLET1_ADDRESS;

  @IsString()
  RELAYER_WALLET1_PRIVATE_KEY = process.env?.RELAYER_WALLET1_PRIVATE_KEY;

  @IsString()
  RELAYER_WALLET2_ADDRESS = process.env?.RELAYER_WALLET2_ADDRESS;

  @IsString()
  RELAYER_WALLET2_PRIVATE_KEY = process.env?.RELAYER_WALLET2_PRIVATE_KEY;

  @IsString()
  RELAYER_WALLET3_ADDRESS = process.env?.RELAYER_WALLET3_ADDRESS;

  @IsString()
  RELAYER_WALLET3_PRIVATE_KEY = process.env?.RELAYER_WALLET3_PRIVATE_KEY;

  @Type(() => Number)
  @IsNumber()
  MAX_MANAGER_COUNT = process.env?.MAX_MANAGER_COUNT
    ? Number(process.env.MAX_MANAGER_COUNT)
    : 3;

  @Type(() => Number)
  @IsNumber()
  MAX_RELAYER_COUNT = process.env?.MAX_RELAYER_COUNT
    ? Number(process.env.MAX_RELAYER_COUNT)
    : 3;

  @IsString()
  POINT_MANAGER_OWNER_ADDRESS = process.env?.POINT_MANAGER_OWNER_ADDRESS;

  @IsString()
  POINT_MANAGER_OWNER_PRIVATE_KEY =
    process.env?.POINT_MANAGER_OWNER_PRIVATE_KEY;

  @IsString()
  POINT_TOKEN_ADDRESS = process.env?.POINT_TOKEN_ADDRESS;
}
