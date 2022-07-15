import {
  NotificationSubscription,
  NotificationType,
  Wallet,
} from '@prisma/client';
import { IsBoolean } from 'class-validator';
import { WalletDto } from '../wallet/wallet.controller.v1.dto';

export interface ConfigSource {
  enabled: boolean;
}

export class NotificationTypeDto {
  id!: string;
  name!: string;
  code!: string;
  description!: string;
  tags!: string[];
  defaultConfig!: NotificationConfigDto;
  dappId!: string;

  static from(notificationType: NotificationType): NotificationTypeDto {
    return {
      id: notificationType.id,
      name: notificationType.name,
      code: notificationType.code,
      description: notificationType.description,
      dappId: notificationType.dappId,
      defaultConfig: NotificationConfigDto.from(notificationType),
      tags: notificationType.tags,
    };
  }
}

export class NotificationConfigDto {
  @IsBoolean()
  enabled!: boolean;

  static from(configSource: ConfigSource) {
    return {
      enabled: configSource.enabled,
    };
  }
}

export class NotificationSubscriptionDto {
  wallet!: WalletDto;
  notificationType!: NotificationTypeDto;
  config!: NotificationConfigDto;

  static from(
    wallet: Wallet,
    notificationType: NotificationType,
    notificationSubscription?: NotificationSubscription,
  ): NotificationSubscriptionDto {
    return {
      wallet: WalletDto.from(wallet),
      notificationType: NotificationTypeDto.from(notificationType),
      config: NotificationSubscriptionDto.resolveConfig(
        notificationType,
        notificationSubscription,
      ),
    };
  }

  static resolveConfig(
    defaultConfig: ConfigSource,
    subscriptionConfig?: ConfigSource,
  ): ConfigSource {
    return subscriptionConfig ?? defaultConfig;
  }
}
