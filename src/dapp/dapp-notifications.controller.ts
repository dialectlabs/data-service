import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import {
  BroadcastNotificationCommandDto,
  DappResourceId,
  MulticastNotificationCommandDto,
  UnicastNotificationCommandDto,
} from './dapp-notifications.controller.dto';
import { DappNotificationsService } from './dapp-notifications.service';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';
import { checkPrincipalAuthorizedToUseDapp } from '../dapp-catalog/dapp.service';

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
    @Body() command: UnicastNotificationCommandDto,
  ) {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.dappNotificationsService.unicast(command, principal);
  }

  @Post(':dappPublicKey/notifications/multicast')
  async multicast(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: MulticastNotificationCommandDto,
  ) {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.dappNotificationsService.multicast(command, principal);
  }

  @Post(':dappPublicKey/notifications/broadcast')
  async broadcast(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: BroadcastNotificationCommandDto,
  ) {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.dappNotificationsService.broadcast(command, principal);
  }
}
