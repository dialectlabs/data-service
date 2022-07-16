import { IsBoolean } from 'class-validator';
import { WalletDto } from '../wallet/wallet.controller.v1.dto';
import {
  fromNotificationTypeDb,
  NotificationConfig,
  NotificationType,
} from './notifications-subscriptions.service';
import { NotificationType as NotificationTypeDB } from '@prisma/client';
import { Transform } from 'class-transformer';

export class NotificationTypeDto {
  id!: string;
  name!: string;
  humanReadableId!: string;
  trigger?: string;
  orderingPriority!: number;
  tags!: string[];
  defaultConfig!: NotificationConfigDto;
  dappId!: string;

  static fromDb(notificationType: NotificationTypeDB) {
    return NotificationTypeDto.from(fromNotificationTypeDb(notificationType));
  }

  static from(notificationType: NotificationType): NotificationTypeDto {
    return {
      id: notificationType.id,
      name: notificationType.name,
      humanReadableId: notificationType.humanReadableId,
      ...(notificationType.trigger && { trigger: notificationType.trigger }),
      orderingPriority: notificationType.orderingPriority,
      dappId: notificationType.dappId,
      defaultConfig: NotificationConfigDto.from(notificationType.defaultConfig),
      tags: notificationType.tags,
    };
  }
}

export class NotificationConfigDto {
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  enabled!: boolean;

  static from(config: NotificationConfig) {
    return {
      enabled: config.enabled,
    };
  }
}

export class NotificationSubscriptionDto {
  wallet!: WalletDto;
  config!: NotificationConfigDto;
}
