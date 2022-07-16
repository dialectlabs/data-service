import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletControllerV0 } from './wallet.controller.v0';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { WalletAddressesControllerV1 } from './wallet-addresses.controller.v1';
import { WalletDappAddressesControllerV1 } from './wallet-dapp-addresses.controller.v1';
import { AddressModule } from '../address/address.module';
import { DappAddressModule } from '../dapp-address/dapp-address.module';
import { DialectModule } from '../dialect/dialect.module';
import { WalletMessagesController } from './wallet-messages.controller';
import { WalletNotificationSubscriptionsController } from './wallet-notification-subscriptions.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    AddressModule,
    DappAddressModule,
    MailModule,
    SmsModule,
    DialectModule,
    NotificationModule,
  ],
  controllers: [
    WalletControllerV0,
    WalletAddressesControllerV1,
    WalletDappAddressesControllerV1,
    WalletMessagesController,
    WalletNotificationSubscriptionsController,
  ],
})
export class WalletModule {}
