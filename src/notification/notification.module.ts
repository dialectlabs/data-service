import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsSubscriptionsService } from './notifications-subscriptions.service';

@Module({
  imports: [PrismaModule],
  providers: [NotificationsSubscriptionsService],
  exports: [NotificationsSubscriptionsService],
  controllers: [],
})
export class NotificationModule {}
