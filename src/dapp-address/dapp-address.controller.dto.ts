import { AddressDto } from '../address/address.controller.dto';
import { Address, Dapp, DappAddress, Wallet } from '@prisma/client';
import { extractTelegramChatId } from './dapp-address.service';
import { IsPublicKey } from '../middleware/public-key-validation';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { DappDto } from '../dapp/dapp.controller.v1.dto';

export class DappAddressDto {
  readonly id!: string;
  readonly enabled!: boolean;
  readonly telegramChatId?: string;
  readonly dapp!: DappDto;
  readonly address!: AddressDto;

  static from(
    dappAddress: DappAddress & {
      dapp: Dapp;
      address: Address & { wallet: Wallet };
    },
  ): DappAddressDto {
    return {
      id: dappAddress.id,
      enabled: dappAddress.enabled,
      telegramChatId: extractTelegramChatId(dappAddress),
      address: AddressDto.from(dappAddress.address),
      dapp: DappDto.from(dappAddress.dapp),
    };
  }
}

export class DappAddressResourceId {
  @IsUUID(4)
  readonly dappAddressId!: string;
}

export class FindDappAddressesQuery {
  @IsOptional()
  @IsPublicKey()
  readonly dappPublicKey?: string;
  @IsOptional()
  @IsUUID(4, { each: true })
  readonly addressIds?: string[];
}

export class CreateDappAddressCommand {
  @IsPublicKey()
  readonly dappPublicKey!: string;
  @IsUUID('4')
  readonly addressId!: string;
  readonly enabled!: boolean;
}

export class PatchDappAddressCommand {
  @IsOptional()
  @IsBoolean()
  readonly enabled?: boolean;
}
