import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletController } from './wallet.controller';
import { LoggerMiddleware } from '../middleware/logger.middleware';
import { DappModule } from '../dapp/dapp.module';
import { MailModule } from '../mail/mail.module';
import { SmsVerificationModule } from 'src/sms/sms.module';

@Module({
  imports: [PrismaModule, DappModule, MailModule, SmsVerificationModule],
  exports: [],
  controllers: [WalletController],
})
export class WalletModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
