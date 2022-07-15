import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { IsPublicKey } from '../middleware/public-key-validation';
import {
  NotificationConfigDto,
  NotificationConfigSource,
  NotificationSubscriptionDto,
  NotificationTypeDto,
  resolveNotificationSubscriptionConfig,
} from '../notification/notification.dto';
import {
  NotificationSubscription,
  NotificationType,
  Wallet,
} from '@prisma/client';
import { WalletDto } from './wallet.controller.v1.dto';

export class FindNotificationSubscriptionQueryDto {
  @IsOptional()
  @IsPublicKey()
  readonly dappPublicKey?: string;
}

export class UpsertNotificationSubscriptionCommandDto {
  @IsPublicKey()
  readonly dappPublicKey!: string;
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
    notificationType: NotificationType,
    notificationSubscription?: NotificationSubscription,
  ): WalletNotificationSubscriptionDto {
    return {
      notificationType: NotificationTypeDto.from(notificationType),
      subscription: {
        wallet: WalletDto.from(wallet),
        config: resolveNotificationSubscriptionConfig(
          notificationType,
          notificationSubscription,
        ),
      },
    };
  }
}
