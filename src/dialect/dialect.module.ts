import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DialectController } from './dialect.controller';
import { LoggerMiddleware } from '../middleware/logger.middleware';

@Module({
  imports: [PrismaModule],
  exports: [],
  controllers: [DialectController],
})
export class DialectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
