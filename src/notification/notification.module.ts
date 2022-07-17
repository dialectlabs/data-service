import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsSubscriptionsService } from './notifications-subscriptions.service';
import { DappAddressModule } from '../dapp-address/dapp-address.module';

@Module({
  imports: [PrismaModule, DappAddressModule],
  providers: [NotificationsSubscriptionsService],
  exports: [NotificationsSubscriptionsService],
  controllers: [],
})
export class NotificationModule {}
