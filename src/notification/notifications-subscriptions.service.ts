import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType as NotificationTypeDb, Wallet } from '@prisma/client';
import { DappAddressService } from '../dapp-address/dapp-address.service';

export interface FindNotificationSubscriptionQuery {
  walletIds?: string[];
  dappPublicKey: string;
  notificationTypeId?: string;
}

export interface UpsertNotificationSubscriptionCommand {
  walletId: string;
  notificationTypeId: string;
  config: NotificationConfig;
}

export interface NotificationSubscription {
  wallet: Wallet;
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly dappAddressService: DappAddressService,
  ) {}

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
      orderBy: {
        orderingPriority: 'desc',
      },
    });
    const notificationSubscriptions =
      await this.prisma.notificationSubscription.findMany({
        where: {
          ...(query.walletIds && {
            walletId: {
              in: query.walletIds,
            },
          }),
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

    const wallets = query.walletIds
      ? await this.prisma.wallet.findMany({
          where: { id: { in: query.walletIds } },
        })
      : (
          await this.dappAddressService.findAll({
            dapp: {
              publicKey: query.dappPublicKey,
            },
          })
        ).map((it) => it.address.wallet);

    return notificationTypes.flatMap((notificationTypeDb) =>
      wallets.map((wallet) => {
        const notificationType = fromNotificationTypeDb(notificationTypeDb);
        const notificationSubscription =
          notificationTypeIdWalletIdToNotificationSubscription[
            `${notificationType.id}_${wallet.id}`
          ];
        return {
          wallet,
          notificationType,
          config: notificationSubscription
            ? toConfig(notificationSubscription)
            : notificationType.defaultConfig,
        };
      }),
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
        wallet: true,
      },
    });

    return {
      wallet: updated.wallet,
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
