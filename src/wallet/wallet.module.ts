import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletController } from './wallet.controller';
import { LoggerMiddleware } from '../middleware/logger.middleware';
import { DappModule } from '../dapp/dapp.module';

@Module({
  imports: [PrismaModule, DappModule],
  exports: [],
  controllers: [WalletController],
})
export class WalletModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
