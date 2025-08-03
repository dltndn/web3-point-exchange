import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Config } from '../../config/environment/config';
import { RabbitmqService } from './rabbitmq.service';
import {
  POINT_SWAP_TRANSACTION_QUEUE,
  POINT_SWAP_TRANSACTION_SERVICE,
  POINT_UPDATE_BALANCE_QUEUE,
  POINT_UPDATE_BALANCE_SERVICE,
} from './constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: POINT_SWAP_TRANSACTION_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [
            `amqp://${Config.getEnvironment().RABBITMQ.USER}:${
              Config.getEnvironment().RABBITMQ.PASSWORD
            }@${Config.getEnvironment().RABBITMQ.HOST}:${
              Config.getEnvironment().RABBITMQ.PORT
            }`,
          ],
          queue: POINT_SWAP_TRANSACTION_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: POINT_UPDATE_BALANCE_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [
            `amqp://${Config.getEnvironment().RABBITMQ.USER}:${
              Config.getEnvironment().RABBITMQ.PASSWORD
            }@${Config.getEnvironment().RABBITMQ.HOST}:${
              Config.getEnvironment().RABBITMQ.PORT
            }`,
          ],
          queue: POINT_UPDATE_BALANCE_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [RabbitmqService],
  exports: [ClientsModule, RabbitmqService],
})
export class RabbitmqModule {}
