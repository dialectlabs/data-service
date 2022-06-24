import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import { DappResourceId } from './dapp.controller.v1.dto';
import {
  BroadcastNotificationCommand,
  MulticastNotificationCommand,
  UnicastNotificationCommand,
} from './dapp-notifications.controller.dto';
import { DappNotificationsService } from './dapp-notifications.service';
import { checkPrincipalAuthorizedToUseDapp } from './dapp.service';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';

@ApiTags('Dapps')
@Controller({
  path: 'dapps',
  version: '1',
})
@UseGuards(AuthenticationGuard, DappAuthenticationGuard)
@ApiBearerAuth()
export class DappNotificationsController {
  constructor(
    private readonly dappNotificationsService: DappNotificationsService,
  ) {}

  @Post(':dappPublicKey/notifications/unicast')
  async unicast(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: UnicastNotificationCommand,
  ) {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.dappNotificationsService.unicast(command, principal);
  }

  @Post(':dappPublicKey/notifications/multicast')
  async multicast(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: MulticastNotificationCommand,
  ) {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.dappNotificationsService.multicast(command, principal);
  }

  @Post(':dappPublicKey/notifications/broadcast')
  async broadcast(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: BroadcastNotificationCommand,
  ) {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.dappNotificationsService.broadcast(command, principal);
  }
}
