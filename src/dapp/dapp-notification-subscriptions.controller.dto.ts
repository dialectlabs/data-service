import {
  NotificationSubscriptionDto,
  NotificationTypeDto,
} from '../notification/notification.dto';

export class DappNotificationSubscriptionDto {
  notificationType!: NotificationTypeDto;
  subscriptions!: NotificationSubscriptionDto[];
}
