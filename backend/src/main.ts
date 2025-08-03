import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Config } from './config/environment/config';
import { POINT_UPDATE_BALANCE_QUEUE } from './modules/rabbitmq/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = Config.getEnvironment();

  // RabbitMQ 마이크로서비스 연결 (POINT_UPDATE_BALANCE_QUEUE 소비용)
  const rabbitMqOptions: MicroserviceOptions = {
    transport: Transport.RMQ,
    options: {
      urls: [
        `amqp://${env.RABBITMQ.USER}:${env.RABBITMQ.PASSWORD}@${env.RABBITMQ.HOST}:${env.RABBITMQ.PORT}`,
      ],
      queue: POINT_UPDATE_BALANCE_QUEUE,
      queueOptions: {
        durable: true,
      },
    },
  };

  app.connectMicroservice<MicroserviceOptions>(rabbitMqOptions, {
    inheritAppConfig: true,
  });

  // 마이크로서비스 시작
  await app.startAllMicroservices();

  // HTTP 서버 시작
  await app.listen(env.SERVER_PORT);

  const exitHandler = () => {
    console.info('Server closed');
    process.exit(1);
  };

  const unexpectedErrorHandler = (error: Error) => {
    console.error('Unexpected error', error);
    exitHandler();
  };

  process.on('uncaughtException', unexpectedErrorHandler);
  process.on('unhandledRejection', unexpectedErrorHandler);
  process.on('SIGINT', exitHandler);
}
bootstrap();
