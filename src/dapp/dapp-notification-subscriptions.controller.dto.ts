import {
  NotificationSubscriptionDto,
  NotificationTypeDto,
  resolveNotificationSubscriptionConfig,
} from '../notification/notification.dto';
import {
  NotificationSubscription,
  NotificationType,
  Wallet,
} from '@prisma/client';
import { WalletDto } from '../wallet/wallet.controller.v1.dto';

export class DappNotificationSubscriptionDto {
  notificationType!: NotificationTypeDto;
  subscriptions!: NotificationSubscriptionDto[];

  static from(
    notificationType: NotificationType & {
      notificationSubscriptions: (NotificationSubscription & {
        wallet: Wallet;
      })[];
    },
  ): DappNotificationSubscriptionDto {
    return {
      notificationType: NotificationTypeDto.from(notificationType),
      subscriptions: notificationType.notificationSubscriptions.map((sub) => ({
        wallet: WalletDto.from(sub.wallet),
        config: resolveNotificationSubscriptionConfig(notificationType, sub),
      })),
    };
  }
}
