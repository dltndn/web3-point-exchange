import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsString } from 'class-validator';

export class DatabaseConfig {
  @IsIn(['postgres'])
  type: 'postgres';

  @IsString()
  host: string;

  @IsString()
  user: string;

  @IsString()
  password: string;

  @IsString()
  database: string;

  @Type(() => Number)
  @IsNumber()
  port: number;

  entities: string[] = ['dist/**/*.entity{.ts,.js}'];

  synchronize: boolean = process.env.NODE_ENV === 'development';
}
