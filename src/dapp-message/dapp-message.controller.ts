import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import {
  DappPrincipal,
  AuthPrincipal,
  Principal,
  DappAuthPrincipal,
} from '../auth/authenticaiton.decorator';
import {
  BroadcastMessageCommandDto,
  DappResourceId,
  MulticastMessageCommandDto,
  UnicastMessageCommandDto,
} from './dapp-message.controller.dto';
import { DappMessageService } from './dapp-message.service';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';
import { checkPrincipalAuthorizedToUseDapp } from '../dapp/dapp.service';

@ApiTags('Dapps')
@Controller({
  path: 'dapps',
  version: '1',
})
@UseGuards(AuthenticationGuard, DappAuthenticationGuard)
@ApiBearerAuth()
export class DappMessageController {
  constructor(private readonly dappMessageService: DappMessageService) {}

  @Post(':dappPublicKey/messages/unicast')
  async unicast(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: UnicastMessageCommandDto,
  ) {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.dappMessageService.unicast(command, principal);
  }

  @Post(':dappPublicKey/messages/multicast')
  async multicast(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: MulticastMessageCommandDto,
  ) {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.dappMessageService.multicast(command, principal);
  }

  @Post(':dappPublicKey/messages/broadcast')
  async broadcast(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: BroadcastMessageCommandDto,
  ) {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.dappMessageService.broadcast(command, principal);
  }
}
