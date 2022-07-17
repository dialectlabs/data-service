import {
  NotificationConfigDto,
  NotificationSubscriptionDto,
  NotificationTypeDto,
} from '../notification/notification.dto';
import { WalletDto } from '../wallet/wallet.controller.v1.dto';
import {
  NotificationSubscription,
  NotificationType,
} from '../notification/notifications-subscriptions.service';

export class DappNotificationSubscriptionDto {
  notificationType!: NotificationTypeDto;
  subscriptions!: NotificationSubscriptionDto[];

  static from(
    notificationType: NotificationType,
    subscriptions: NotificationSubscription[],
  ): DappNotificationSubscriptionDto {
    return {
      notificationType: NotificationTypeDto.from(notificationType),
      subscriptions: subscriptions.map((subscription) => ({
        wallet: WalletDto.from(subscription.wallet),
        config: NotificationConfigDto.from(subscription.config),
      })),
    };
  }
}
