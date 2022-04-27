import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { DappModule } from './dapp/dapp.module';
import { MailModule } from './mail/mail.module';
import { SmsVerificationModule } from './sms/sms.module';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    DappModule,
    MailModule,
    SmsVerificationModule,
  ],
  providers: [],
})
export class AppModule {}
