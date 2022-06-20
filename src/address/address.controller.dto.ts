import { toWalletDto, WalletDto } from '../wallet/wallet.controller.v1.dto';
import { Address, Wallet } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IllegalStateError } from '@dialectlabs/sdk';
import { PersistedAddressType } from './address.repository';

export class AddressDto {
  readonly id!: string;
  readonly type!: AddressTypeDto;
  readonly verified!: boolean;
  readonly value!: string;
  readonly wallet!: WalletDto;
}

export enum AddressTypeDto {
  Email = 'EMAIL',
  Sms = 'SMS',
  Telegram = 'TELEGRAM',
  Wallet = 'WALLET',
}

export function toAddressDto(
  address: Address & { wallet: Wallet },
): AddressDto {
  const wallet = address.wallet;
  return {
    id: address.id,
    value: address.value,
    type: toAddressTypeDto(address.type as PersistedAddressType),
    verified: address.verified,
    wallet: toWalletDto(wallet),
  };
}

function toAddressTypeDto(type: PersistedAddressType): AddressTypeDto {
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
      throw new IllegalStateError(`Unknown address type ${type}`);
    }
  }
}

export function fromAddressTypeDto(type: AddressTypeDto): PersistedAddressType {
  switch (type) {
    case AddressTypeDto.Email: {
      return 'email';
    }
    case AddressTypeDto.Sms: {
      return 'sms';
    }
    case AddressTypeDto.Telegram: {
      return 'telegram';
    }
    case AddressTypeDto.Wallet: {
      return 'wallet';
    }
    default: {
      throw new IllegalStateError(`Unknown address type ${type}`);
    }
  }
}

export class AddressResourceId {
  @IsUUID(4)
  readonly addressId!: string;
}

export class CreateAddressCommand {
  @IsString()
  // TODO: https://stackoverflow.com/questions/68610924/how-to-use-else-condition-in-validationif-decorator-nestjs-class-validator
  readonly value!: string;
  @IsEnum(AddressTypeDto)
  readonly type!: AddressTypeDto;
}

export class PatchAddressCommand {
  @IsString()
  @IsOptional()
  // TODO: https://stackoverflow.com/questions/68610924/how-to-use-else-condition-in-validationif-decorator-nestjs-class-validator
  readonly value?: string;
}
