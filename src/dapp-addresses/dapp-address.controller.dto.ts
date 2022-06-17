import { AddressDto, toAddressDto } from '../addresses/address.controller.dto';
import { DappDto, toDappDto } from '../dapp/dapp.controller.dto';
import { Address, Dapp, DappAddress, Wallet } from '@prisma/client';
import { extractTelegramChatId } from './dapp-address.service';

export class DappAddressDto {
  readonly id!: string;
  readonly enabled!: boolean;
  readonly telegramChatId?: string;
  readonly dapp!: DappDto;
  readonly address!: AddressDto;
}

export function toDappAddressDto(
  dappAddress: DappAddress & {
    dapp: Dapp;
    address: Address & { wallet: Wallet };
  },
): DappAddressDto {
  return {
    id: dappAddress.id,
    enabled: dappAddress.enabled,
    telegramChatId: extractTelegramChatId(dappAddress),
    address: toAddressDto(dappAddress.address),
    dapp: toDappDto(dappAddress.dapp),
  };
}
