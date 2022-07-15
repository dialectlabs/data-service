import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { PrismaService } from '../prisma/prisma.service';
import {
  FindNotificationSubscriptionQueryDto,
  UpsertNotificationSubscriptionCommandDto,
} from './wallet-notification-subscription.controller.dto';
import { NotificationSubscriptionDto } from '../notification/notification.dto';

@ApiTags('Wallet notification subscriptions')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'wallets/me',
  version: '1',
})
export class WalletNotificationSubscriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/notificationSubscriptions')
  async findAll(
    @AuthPrincipal() { wallet }: Principal,
    @Query() query: FindNotificationSubscriptionQueryDto,
  ): Promise<NotificationSubscriptionDto[]> {
    const notificationTypes = await this.prisma.notificationType.findMany({
      where: {
        dapp: {
          publicKey: query.dappPublicKey,
        },
      },
    });
    const notificationSubscriptions =
      await this.prisma.notificationSubscription.findMany({
        where: {
          walletId: wallet.id,
          notificationTypeId: {
            in: notificationTypes.map(({ id }) => id),
          },
        },
      });
    const notificationTypeIdToNotificationSubscription = Object.fromEntries(
      notificationSubscriptions.map((it) => [it.notificationTypeId, it]),
    );
    return notificationTypes
      .map((notificationType) => ({
        notificationType,
        notificationSubscription:
          notificationTypeIdToNotificationSubscription[notificationType.id],
      }))
      .map(({ notificationType, notificationSubscription }) =>
        NotificationSubscriptionDto.from(
          wallet,
          notificationType,
          notificationSubscription,
        ),
      );
  }

  @Post('/notificationSubscriptions')
  async upsert(
    @AuthPrincipal() { wallet }: Principal,
    @Query() command: UpsertNotificationSubscriptionCommandDto,
  ): Promise<NotificationSubscriptionDto> {
    const updated = await this.prisma.notificationSubscription.upsert({
      where: {
        walletId_notificationTypeId: {
          walletId: wallet.id,
          notificationTypeId: command.notificationTypeId,
        },
      },
      create: {
        walletId: wallet.id,
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
    return NotificationSubscriptionDto.from(
      wallet,
      updated.notificationType,
      updated,
    );
  }
}
