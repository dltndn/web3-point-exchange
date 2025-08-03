import { Environment } from './environment';
import { config as dotenvConfig } from 'dotenv';
import { plainToClass } from 'class-transformer';

export class Config {
  private static instance: Environment;
  private constructor() {}

  public static getEnvironment(): Environment {
    if (!Config.instance) {
      const envFilePath = '.env';
      dotenvConfig({ path: envFilePath });
      Config.instance = plainToClass(Environment, process.env);
      Object.freeze(Config.instance);
    }
    return Config.instance;
  }
}
