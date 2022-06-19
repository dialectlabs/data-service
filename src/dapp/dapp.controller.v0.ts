// TODO: Enforce UUID format in some kind of middleware exception handling.
// Consolidate exception handling into single wrapper
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriberDto } from './dapp.controller.v0.dto';
import _ from 'lodash';
import { DappService } from './dapp.service';
import { PublicKeyValidationPipe } from '../middleware/public-key-validation';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';
import { extractTelegramChatId } from '../dapp-addresses/dapp-address.service';

@ApiTags('Dapps')
@Controller({
  path: 'dapps',
  version: '0',
})
export class DappControllerV0 {
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
}
