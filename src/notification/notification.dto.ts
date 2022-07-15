import { NotificationType } from '@prisma/client';
import { IsBoolean } from 'class-validator';
import { WalletDto } from '../wallet/wallet.controller.v1.dto';

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

  static from(configSource: NotificationConfigSource) {
    return {
      enabled: configSource.enabled,
    };
  }
}

export class NotificationSubscriptionDto {
  wallet!: WalletDto;
  config!: NotificationConfigDto;
}

export interface NotificationConfigSource {
  enabled: boolean;
}

export function resolveNotificationSubscriptionConfig(
  defaultConfig: NotificationConfigSource,
  subscriptionConfig?: NotificationConfigSource,
): NotificationConfigSource {
  return subscriptionConfig ?? defaultConfig;
}
