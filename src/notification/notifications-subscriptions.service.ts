import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DappAddressService } from '../dapp-address/dapp-address.service';
import {
  NotificationConfig,
  NotificationSubscription,
  NotificationType,
} from './model';
import { NotificationsTypesService } from './notifications-types.service';

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

@Injectable()
export class NotificationsSubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsTypesService: NotificationsTypesService,
    private readonly dappAddressService: DappAddressService,
  ) {}

  async findAll(
    query: FindNotificationSubscriptionQuery,
  ): Promise<NotificationSubscription[]> {
    const notificationTypes = await this.notificationsTypesService.findAll({
      dappPublicKey: query.dappPublicKey,
      notificationTypeId: query.notificationTypeId,
      walletIds: query.walletIds,
    });
    const notificationSubscriptions =
      await this.getPersistedNotificationSubscriptions(
        query,
        notificationTypes,
      );
    const subscriberWallets = await this.getSubscriberWallets(query);
    const notificationTypeIdWalletIdToNotificationSubscription =
      Object.fromEntries(
        notificationSubscriptions.map((it) => [
          createSubscriberNotificationTypeIdKey(
            it.notificationTypeId,
            it.walletId,
          ),
          it,
        ]),
      );
    return notificationTypes.flatMap((notificationType) =>
      subscriberWallets.map((wallet) => {
        const notificationSubscription =
          notificationTypeIdWalletIdToNotificationSubscription[
            createSubscriberNotificationTypeIdKey(
              notificationType.id,
              wallet.id,
            )
          ];
        return {
          wallet,
          notificationType,
          config: notificationSubscription
            ? NotificationConfig.fromConfigSourceDb(notificationSubscription)
            : notificationType.defaultConfig,
        };
      }),
    );
  }

  private getSubscriberWallets(query: FindNotificationSubscriptionQuery) {
    if (query.walletIds) {
      return this.prisma.wallet.findMany({
        where: { id: { in: query.walletIds } },
      });
    }
    return this.dappAddressService
      .findAll({
        dapp: {
          publicKey: query.dappPublicKey,
        },
      })
      .then((dappAddresses) => dappAddresses.map((it) => it.address.wallet));
  }

  private getPersistedNotificationSubscriptions(
    query: FindNotificationSubscriptionQuery,
    notificationTypes: NotificationType[],
  ) {
    return this.prisma.notificationSubscription.findMany({
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
      notificationType: NotificationType.fromNotificationTypeDb(
        updated.notificationType,
      ),
      config: NotificationConfig.fromConfigSourceDb(updated),
    };
  }
}

function createSubscriberNotificationTypeIdKey(
  notificationTypeId: string,
  walletId: string,
) {
  return `${notificationTypeId}_${walletId}`;
}
