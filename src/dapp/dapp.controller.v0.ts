// TODO: Enforce UUID format in some kind of middleware exception handling.
// Consolidate exception handling into single wrapper
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriberDto } from './dapp.controller.v0.dto';
import _ from 'lodash';
import { DappService } from './dapp.service';
import { PublicKeyValidationPipe } from '../middleware/public-key-validation';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { extractTelegramChatId } from '../dapp-address/dapp-address.service';
import { DappControllerV1 } from './dapp.controller.v1';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';

@ApiTags('Dapps')
@Controller({
  path: 'v0/dapps',
})
@UseGuards(AuthenticationGuard)
@ApiBearerAuth()
export class DappControllerV0 {
  constructor(
    private readonly dappService: DappService,
    private readonly dappControllerV1: DappControllerV1,
  ) {}

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
    await this.dappControllerV1.findOne(principal, { dappPublicKey });
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
