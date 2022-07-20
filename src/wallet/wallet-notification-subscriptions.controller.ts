import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import { AuthenticationGuard } from '../auth/authentication.guard';
import {
  FindNotificationSubscriptionQueryDto,
  UpsertNotificationSubscriptionCommandDto,
  WalletNotificationSubscriptionDto,
} from './wallet-notification-subscription.controller.dto';
import { NotificationsSubscriptionsService } from '../notification/notifications-subscriptions.service';

@ApiTags('Wallet notification subscriptions')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'wallets/me',
  version: '1',
})
export class WalletNotificationSubscriptionsController {
  constructor(
    private readonly notificationsSubscriptionsService: NotificationsSubscriptionsService,
  ) {}

  @Get('/notificationSubscriptions')
  async findAll(
    @AuthPrincipal() { wallet }: Principal,
    @Query() query: FindNotificationSubscriptionQueryDto,
  ): Promise<WalletNotificationSubscriptionDto[]> {
    const subscriptions = await this.notificationsSubscriptionsService.findAll({
      walletIds: [wallet.id],
      dappPublicKey: query.dappPublicKey,
    });
    return subscriptions.map((it) =>
      WalletNotificationSubscriptionDto.from(wallet, it),
    );
  }

  @Post('/notificationSubscriptions')
  async upsert(
    @AuthPrincipal() { wallet }: Principal,
    @Body() command: UpsertNotificationSubscriptionCommandDto,
  ): Promise<WalletNotificationSubscriptionDto> {
    const updated = await this.notificationsSubscriptionsService.upsert({
      walletId: wallet.id,
      config: {
        enabled: command.config.enabled,
      },
      notificationTypeId: command.notificationTypeId,
    });
    return WalletNotificationSubscriptionDto.from(wallet, updated);
  }
}
