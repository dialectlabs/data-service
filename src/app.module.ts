import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { DappModule } from './dapp/dapp.module';
import { MailModule } from './mail/mail.module';
import { SmsVerificationModule } from './sms/sms.module';
import { TelegramModule } from './telegram/telegram.module';
import { SubscriberModule } from './subscriber/subscriber.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    WalletModule,
    DappModule,
    MailModule,
    SmsVerificationModule,
    TelegramModule,
    SubscriberModule,
  ],
  providers: [],
})
export class AppModule {}
