import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { Web2SubscriberController } from './web2Subscriber.controller';
import { LoggerMiddleware } from '../middleware/logger.middleware';

@Module({
  imports: [PrismaModule],
  exports: [],
  controllers: [Web2SubscriberController],
})
export class Web2SubscriberModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
