import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { DappModule } from './dapp/dapp.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [PrismaModule, WalletModule, DappModule, MailModule],
  providers: [],
})
export class AppModule {}
