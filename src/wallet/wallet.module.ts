import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletControllerV0 } from './wallet.controller.v0';
import { DappModule } from '../dapp/dapp.module';
import { MailModule } from '../mail/mail.module';
import { SmsVerificationModule } from 'src/sms/sms.module';
import { WalletService } from './wallet.service';
import { WalletAddressesControllerV1 } from './wallet-addresses.controller.v1';
import { WalletDappAddressesControllerV1 } from './wallet-dapp-addresses.controller.v1';

@Module({
  imports: [PrismaModule, DappModule, MailModule, SmsVerificationModule],
  exports: [WalletService],
  providers: [WalletService],
  controllers: [
    WalletControllerV0,
    WalletAddressesControllerV1,
    WalletDappAddressesControllerV1,
  ],
})
export class WalletModule {}
