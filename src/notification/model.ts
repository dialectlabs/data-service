import { NotificationType as NotificationTypeDb, Wallet } from '@prisma/client';

export class NotificationSubscription {
  wallet!: Wallet;
  notificationType!: NotificationType;
  config!: NotificationConfig;
}

export class NotificationType {
  id!: string;
  humanReadableId!: string;
  name!: string;
  trigger?: string | null;
  orderingPriority!: number;
  tags!: string[];
  defaultConfig!: NotificationConfig;
  dappId!: string;

  static fromNotificationTypeDb(
    notificationType: NotificationTypeDb,
  ): NotificationType {
    const defaultConfig =
      NotificationConfig.fromConfigSourceDb(notificationType);
    return {
      ...notificationType,
      defaultConfig,
    };
  }
}

export interface NotificationConfigSource {
  enabled: boolean;
}

export class NotificationConfig {
  enabled!: boolean;

  static fromConfigSourceDb(
    source: NotificationConfigSource,
  ): NotificationConfig {
    return {
      enabled: source.enabled,
    };
  }
}
