import { toWalletDto, WalletDto } from '../wallet/wallet.controller.dto';
import { Address, Wallet } from '@prisma/client';

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
    type: toAddressTypeDto(address.type),
    verified: address.verified,
    wallet: toWalletDto(wallet),
  };
}

function toAddressTypeDto(type: string): AddressTypeDto {
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
