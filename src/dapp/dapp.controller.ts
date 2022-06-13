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
  AddressDto,
  AddressTypeDto,
  CreateDappCommand,
  DappAddressDto,
  DappDto,
  SubscriberDto,
  WalletDto,
} from './dapp.controller.dto';
import _ from 'lodash';
import { DappService } from './dapp.service';
import { Address, Dapp, DappAddress, Prisma, Wallet } from '@prisma/client';
import { PublicKeyValidationPipe } from '../middleware/public-key-validation';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';

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
          telegramId: DappController.extractTelegramChatId(it),
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

  private static extractTelegramChatId(
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

  @Post()
  @UseGuards(AuthenticationGuard)
  async create(
    @AuthPrincipal() principal: Principal,
    @Body() command: CreateDappCommand,
  ): Promise<DappDto> {
    DappController.checkOperationAllowed(command.publicKey, principal);
    const dapp = await this.dappService.create(command.publicKey);
    return DappController.toDappDto(dapp);
  }

  private static toDappDto(dapp: Dapp) {
    return {
      id: dapp.id,
      publicKey: dapp.publicKey,
    };
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
    return dappAddresses.map((it) => ({
      id: it.id,
      enabled: it.enabled,
      telegramChatId: DappController.extractTelegramChatId(it),
      address: DappController.toAddressDto(it.address),
    }));
  }

  private static toAddressDto(
    address: Address & { wallet: Wallet },
  ): AddressDto {
    const wallet = address.wallet;
    return {
      id: address.id,
      value: address.value,
      type: DappController.toAddressTypeDto(address.type),
      verified: address.verified,
      wallet: this.toWalletDto(wallet),
    };
  }

  private static toWalletDto(wallet: Wallet): WalletDto {
    return {
      id: wallet.id,
      publicKey: wallet.publicKey,
    };
  }

  private static toAddressTypeDto(type: string): AddressTypeDto {
    switch (type) {
      case 'email': {
        return AddressTypeDto.Email;
      }
      case 'sms': {
        return AddressTypeDto.Sms;
      }
      case 'telegram': {
        return AddressTypeDto.Telegram;
      }
      case 'wallet': {
        return AddressTypeDto.Wallet;
      }
      default: {
        throw new Error('Should not happen');
      }
    }
  }

  private static checkOperationAllowed(
    dappPublicKey: string,
    principal: Principal,
  ) {
    if (dappPublicKey !== principal.wallet.publicKey) {
      throw new ForbiddenException(
        `Not authorized to get addresses for ${dappPublicKey}.`,
      );
    }
  }
}
