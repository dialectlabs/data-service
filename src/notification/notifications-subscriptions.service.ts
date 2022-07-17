import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType as NotificationTypeDb } from '@prisma/client';

export interface FindNotificationSubscriptionQuery {
  walletIds: string[];
  dappPublicKey?: string;
  notificationTypeId?: string;
}

export interface UpsertNotificationSubscriptionCommand {
  walletId: string;
  notificationTypeId: string;
  config: NotificationConfig;
}

export interface NotificationSubscription {
  walletId: string;
  notificationType: NotificationType;
  config: NotificationConfig;
}

export interface NotificationType {
  id: string;
  humanReadableId: string;
  name: string;
  trigger?: string | null;
  orderingPriority: number;
  tags: string[];
  defaultConfig: NotificationConfig;
  dappId: string;
}

export interface NotificationConfigSource {
  enabled: boolean;
}

export interface NotificationConfig {
  enabled: boolean;
}

@Injectable()
export class NotificationsSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: FindNotificationSubscriptionQuery,
  ): Promise<NotificationSubscription[]> {
    const notificationTypes = await this.prisma.notificationType.findMany({
      where: {
        ...(query.notificationTypeId && {
          id: query.notificationTypeId,
        }),
        ...(query.dappPublicKey && {
          dapp: {
            publicKey: query.dappPublicKey,
          },
        }),
      },
      include: {
        dapp: true,
      },
    });
    const notificationSubscriptions =
      await this.prisma.notificationSubscription.findMany({
        where: {
          walletId: {
            in: query.walletIds,
          },
          notificationTypeId: {
            in: notificationTypes.map(({ id }) => id),
          },
        },
        include: {
          wallet: true,
        },
      });
    const notificationTypeIdWalletIdToNotificationSubscription =
      Object.fromEntries(
        notificationSubscriptions.map((it) => [
          `${it.notificationTypeId}_${it.walletId}`,
          it,
        ]),
      );

    return notificationTypes
      .flatMap((notificationTypeDb) =>
        query.walletIds.map((walletId) => {
          const notificationType = fromNotificationTypeDb(notificationTypeDb);
          const notificationSubscription =
            notificationTypeIdWalletIdToNotificationSubscription[
              `${notificationType.id}_${walletId}`
            ];
          return {
            walletId,
            notificationType,
            config: notificationSubscription
              ? toConfig(notificationSubscription)
              : notificationType.defaultConfig,
          };
        }),
      )
      .sort(
        (a, b) =>
          b.notificationType.orderingPriority -
          a.notificationType.orderingPriority,
      );
  }

  async upsert(
    command: UpsertNotificationSubscriptionCommand,
  ): Promise<NotificationSubscription> {
    const updated = await this.prisma.notificationSubscription.upsert({
      where: {
        walletId_notificationTypeId: {
          walletId: command.walletId,
          notificationTypeId: command.notificationTypeId,
        },
      },
      create: {
        walletId: command.walletId,
        notificationTypeId: command.notificationTypeId,
        enabled: command.config.enabled,
      },
      update: {
        enabled: command.config.enabled,
      },
      include: {
        notificationType: true,
      },
    });

    return {
      walletId: command.walletId,
      notificationType: fromNotificationTypeDb(updated.notificationType),
      config: toConfig(updated),
    };
  }
}

export function fromNotificationTypeDb(
  notificationType: NotificationTypeDb,
): NotificationType {
  const defaultConfig = toConfig(notificationType);
  return {
    ...notificationType,
    defaultConfig,
  };
}

function toConfig(source: NotificationConfigSource): NotificationConfig {
  return {
    enabled: source.enabled,
  };
}
