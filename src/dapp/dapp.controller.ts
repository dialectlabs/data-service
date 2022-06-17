// TODO: Enforce UUID format in some kind of middleware exception handling.
// Consolidate exception handling into single wrapper
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateDappCommand,
  DappDto,
  SubscriberDto,
  toDappDto,
} from './dapp.controller.dto';
import _ from 'lodash';
import { DappService } from './dapp.service';
import { PublicKeyValidationPipe } from '../middleware/public-key-validation';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import {
  DappAddressDto,
  toDappAddressDto,
} from '../dapp-addresses/dapp-address.controller.dto';
import { extractTelegramChatId } from '../dapp-addresses/dapp-address.service';

@ApiTags('Dapps')
@Controller({
  path: 'dapps',
  version: '0',
})
export class DappController {
  constructor(private readonly dappService: DappService) {}

  /**
   Dapp Subscriber Addresses
   Query all addresses for a given dapp and arrange by Subscriber
   Returns addresses ONLY if verified and enabled.
   */
  @Get(':public_key/subscribers')
  @UseGuards(AuthenticationGuard, DappAuthenticationGuard)
  @ApiOperation({
    deprecated: true,
    description: 'Use /:public_key/dappAddresses instead',
  })
  async get(
    @Param('public_key', PublicKeyValidationPipe) dappPublicKey: string,
  ): Promise<SubscriberDto[]> {
    const dappAddresses = await this.dappService.findDappAdresses(
      dappPublicKey,
    );
    return _(dappAddresses)
      .map((it) => ({
        resourceId: it.address.wallet.publicKey,
        ...(it.address.type === 'email' && { email: it.address.value }),
        ...(it.address.type === 'telegram' && {
          telegramId: extractTelegramChatId(it),
        }),
        ...(it.address.type === 'sms' && { smsNumber: it.address.value }),
      }))
      .groupBy('resourceId')
      .mapValues((s, resourceId) => ({
        resourceId,
        telegramId: s.map(({ telegramId }) => telegramId).find((it) => it),
        smsNumber: s.map(({ smsNumber }) => smsNumber).find((it) => it),
        email: s.map(({ email }) => email).find((it) => it),
      }))
      .values()
      .value();
  }

  @Post()
  @UseGuards(AuthenticationGuard)
  async create(
    @AuthPrincipal() principal: Principal,
    @Body() command: CreateDappCommand,
  ): Promise<DappDto> {
    DappController.checkOperationAllowed(command.publicKey, principal);
    const dapp = await this.dappService.create(command.publicKey);
    return toDappDto(dapp);
  }

  @Get(':public_key/dappAddresses')
  @UseGuards(AuthenticationGuard, DappAuthenticationGuard)
  async dappAddresses(
    @AuthPrincipal() principal: Principal,
    @Param('public_key', PublicKeyValidationPipe) dappPublicKey: string,
  ): Promise<DappAddressDto[]> {
    DappController.checkOperationAllowed(dappPublicKey, principal);
    const dappAddresses = await this.dappService.findDappAdresses(
      dappPublicKey,
    );
    return dappAddresses.map((it) => toDappAddressDto(it));
  }

  private static checkOperationAllowed(
    dappPublicKey: string,
    principal: Principal,
  ) {
    if (dappPublicKey !== principal.wallet.publicKey) {
      throw new ForbiddenException(
        `Not authorized to perform operations for dapp ${dappPublicKey}.`,
      );
    }
  }
}
