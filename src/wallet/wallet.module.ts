import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletController } from './wallet.controller';
import { DappModule } from '../dapp/dapp.module';
import { MailModule } from '../mail/mail.module';
import { SmsVerificationModule } from 'src/sms/sms.module';
import { WalletService } from './wallet.service';

@Module({
  imports: [PrismaModule, DappModule, MailModule, SmsVerificationModule],
  exports: [WalletService],
  providers: [WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
