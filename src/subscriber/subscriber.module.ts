import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriberController } from './subscriber.controller';
import { LoggerMiddleware } from '../middleware/logger.middleware';

@Module({
  imports: [PrismaModule],
  exports: [],
  controllers: [SubscriberController],
})
export class SubscriberModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
