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
import { PrismaService } from '../prisma/prisma.service';
import { DappNotificationSubscriptionDto } from './dapp-notification-subscriptions.controller.dto';

@ApiTags('Dapp notification subscriptions')
@Controller({
  path: 'dapps/:dappPublicKey/notificationSubscriptions',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthenticationGuard, DappAuthenticationGuard)
export class DappNotificationSubscriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
  ): Promise<DappNotificationSubscriptionDto[]> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    const notificationTypes = await this.prisma.notificationType.findMany({
      where: {
        dappId: principal.dapp.id,
      },
      include: {
        notificationSubscriptions: {
          include: {
            wallet: true,
          },
        },
      },
    });
    return notificationTypes.map((it) =>
      DappNotificationSubscriptionDto.from(it),
    );
  }
}
