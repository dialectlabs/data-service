import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletControllerV0 } from './wallet.controller.v0';
import { DappModule } from '../dapp/dapp.module';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { WalletService } from './wallet.service';
import { WalletAddressesControllerV1 } from './wallet-addresses.controller.v1';
import { WalletDappAddressesControllerV1 } from './wallet-dapp-addresses.controller.v1';
import { AddressModule } from '../address/address.module';
import { DappAddressModule } from '../dapp-address/dapp-address.module';

@Module({
  imports: [
    PrismaModule,
    AddressModule,
    DappAddressModule,
    DappModule,
    MailModule,
    SmsModule,
  ],
  exports: [WalletService],
  providers: [WalletService],
  controllers: [
    WalletControllerV0,
    WalletAddressesControllerV1,
    WalletDappAddressesControllerV1,
  ],
})
export class WalletModule {}
