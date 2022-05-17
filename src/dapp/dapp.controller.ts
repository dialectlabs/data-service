// TODO: Enforce UUID format in some kind of middleware exception handling.
// Consolidate exception handling into single wrapper
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubscriberDto } from './dapp.controller.dto';
import _ from 'lodash';
import { DappService } from './dapp.service';
import { DappAddress, Prisma } from '@prisma/client';
import { PublicKeyValidationPipe } from '../middleware/public-key-validation-pipe';
import { AuthGuard } from '../auth/auth.guard';
import { DappAuthorizationGuard } from '../auth/dapp-authorization.guard';

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
  @UseGuards(AuthGuard, DappAuthorizationGuard)
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
          telegramId: DappController.extractTelegramId(it),
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

  private static extractTelegramId(
    dappAddress: DappAddress,
  ): string | undefined {
    if (!dappAddress.metadata) {
      return;
    }
    const metadata = dappAddress.metadata as Prisma.JsonObject;
    if (metadata.telegram_chat_id) {
      return metadata.telegram_chat_id as string;
    }
  }
}
