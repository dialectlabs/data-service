import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import {
  DappAuthPrincipal,
  DappPrincipal,
} from '../auth/authenticaiton.decorator';
import { DappResourceId } from './dapp.controller.dto';
import { checkPrincipalAuthorizedToUseDapp } from './dapp.service';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';
import { DappNotificationSubscriptionDto } from './dapp-notification-subscriptions.controller.dto';
import { NotificationsSubscriptionsService } from '../notification/notifications-subscriptions.service';
import { chain } from 'lodash';

@ApiTags('Dapp notification subscriptions')
@Controller({
  path: 'dapps/:dappPublicKey/notificationSubscriptions',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthenticationGuard, DappAuthenticationGuard)
export class DappNotificationSubscriptionsController {
  constructor(
    private readonly notificationsSubscriptionsService: NotificationsSubscriptionsService,
  ) {}

  @Get()
  async findAll(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
  ): Promise<DappNotificationSubscriptionDto[]> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);

    const notificationSubscriptions =
      await this.notificationsSubscriptionsService.findAll({
        dappPublicKey,
      });

    const notificationTypeIdToNotificationType = Object.fromEntries(
      notificationSubscriptions.map((it) => [
        it.notificationType.id,
        it.notificationType,
      ]),
    );

    return chain(notificationSubscriptions)
      .groupBy((it) => it.notificationType.id)
      .map((subscriptions, notificationTypeId) =>
        DappNotificationSubscriptionDto.from(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          notificationTypeIdToNotificationType[notificationTypeId]!,
          subscriptions,
        ),
      )
      .value();
  }
}
