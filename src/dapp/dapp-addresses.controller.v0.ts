import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SubscriberDto } from './dapp-addresses.controller.v0.dto';
import _ from 'lodash';
import { PublicKeyValidationPipe } from '../middleware/public-key-validation';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import {
  DappAddressService,
  extractTelegramChatId,
} from '../dapp-address/dapp-address.service';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';
import { checkPrincipalAuthorizedToUseDapp } from './dapp.service';

@ApiTags('Dapps')
@Controller({
  path: 'v0/dapps',
})
@UseGuards(AuthenticationGuard, DappAuthenticationGuard)
@ApiBearerAuth()
@ApiBasicAuth()
export class DappAddressesControllerV0 {
  constructor(private readonly dappAddressService: DappAddressService) {}

  /**
   Dapp Subscriber Addresses
   Query all addresses for a given dapp and arrange by Subscriber
   Returns addresses ONLY if verified and enabled.
   */
  @Get(':public_key/subscribers')
  @ApiOperation({
    deprecated: true,
    description: 'Use /v1 api instead',
  })
  async get(
    @AuthPrincipal() principal: Principal,
    @Param('public_key', PublicKeyValidationPipe) dappPublicKey: string,
  ): Promise<SubscriberDto[]> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    const dappAddresses = await this.dappAddressService.findAll({
      enabled: true,
      address: {
        verified: true,
      },
      dapp: {
        publicKey: dappPublicKey,
      },
    });
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
}
