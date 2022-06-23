import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import { DappResourceId } from './dapp.controller.v1.dto';
import { SendNotificationCommand } from './dapp-notifications.controller.dto';
import { DappNotificationsService } from './dapp-notifications.service';
import { DappControllerV1 } from './dapp.controller.v1';

@ApiTags('Dapps')
@Controller({
  path: 'dapps',
  version: '1',
})
@UseGuards(AuthenticationGuard)
@ApiBearerAuth()
export class DappNotificationsController {
  constructor(
    private readonly dappNotificationsService: DappNotificationsService,
  ) {}

  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @Post(':dappPublicKey/notifications')
  async send(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: SendNotificationCommand,
  ) {
    DappControllerV1.checkOperationAllowed(dappPublicKey, principal);
    await this.dappNotificationsService.send(dappPublicKey, command);
  }
}
