import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { IsPublicKey } from '../middleware/public-key-validation';
import {
  NotificationConfigDto,
  NotificationSubscriptionDto,
  NotificationTypeDto,
} from '../notification/notification.dto';
import { Wallet } from '@prisma/client';
import { WalletDto } from './wallet.controller.v1.dto';
import { NotificationSubscription } from '../notification/notifications-subscriptions.service';

export class FindNotificationSubscriptionQueryDto {
  @IsOptional()
  @IsPublicKey()
  readonly dappPublicKey?: string;
}

export class UpsertNotificationSubscriptionCommandDto {
  @IsUUID(4)
  readonly notificationTypeId!: string;
  @ValidateNested()
  readonly config!: NotificationConfigDto;
}

export class WalletNotificationSubscriptionDto {
  notificationType!: NotificationTypeDto;
  subscription!: NotificationSubscriptionDto;

  static from(
    wallet: Wallet,
    subscription: NotificationSubscription,
  ): WalletNotificationSubscriptionDto {
    return {
      notificationType: NotificationTypeDto.from(subscription.notificationType),
      subscription: {
        wallet: WalletDto.from(wallet),
        config: NotificationConfigDto.from(subscription.config),
      },
    };
  }
}
