import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsSubscriptionsService } from './notifications-subscriptions.service';
import { DappAddressModule } from '../dapp-address/dapp-address.module';
import { NotificationsTypesService } from './notifications-types.service';

@Module({
  imports: [PrismaModule, DappAddressModule],
  providers: [NotificationsTypesService, NotificationsSubscriptionsService],
  exports: [NotificationsTypesService, NotificationsSubscriptionsService],
  controllers: [],
})
export class NotificationModule {}
