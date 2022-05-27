import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DialectController } from './dialect.controller';
import { LoggerMiddleware } from '../middleware/logger.middleware';
import { DialectService } from './dialect.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [DialectService],
  controllers: [DialectController],
})
export class DialectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
