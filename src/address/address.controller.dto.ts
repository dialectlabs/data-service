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

  static from(address: Address & { wallet: Wallet }): AddressDto {
    const wallet = address.wallet;
    return {
      id: address.id,
      value: address.value,
      type: toAddressTypeDto(address.type as PersistedAddressType),
      verified: address.verified,
      wallet: toWalletDto(wallet),
    };
  }
}

export enum AddressTypeDto {
  Email = 'EMAIL',
  PhoneNumber = 'PHONE_NUMBER',
  Telegram = 'TELEGRAM',
  Wallet = 'WALLET',
}

const addressTypeDtoToPersistedAddressType: Record<
  AddressTypeDto,
  PersistedAddressType
> = {
  [AddressTypeDto.Email]: 'email',
  [AddressTypeDto.PhoneNumber]: 'sms',
  [AddressTypeDto.Telegram]: 'telegram',
  [AddressTypeDto.Wallet]: 'wallet',
};

const persistedAddressTypeToAddressTypeDto: Record<
  PersistedAddressType,
  AddressTypeDto
> = {
  ['email']: AddressTypeDto.Email,
  ['sms']: AddressTypeDto.PhoneNumber,
  ['telegram']: AddressTypeDto.Telegram,
  ['wallet']: AddressTypeDto.Wallet,
};

export function toAddressTypeDto(type: PersistedAddressType): AddressTypeDto {
  const addressTypeDto = persistedAddressTypeToAddressTypeDto[type];
  if (!addressTypeDto) {
    throw new IllegalStateError(`Unknown address type ${type}`);
  }
  return addressTypeDto;
}

export function fromAddressTypeDto(type: AddressTypeDto): PersistedAddressType {
  const persistedAddressType = addressTypeDtoToPersistedAddressType[type];
  if (!persistedAddressType) {
    throw new IllegalStateError(`Unknown address type ${type}`);
  }
  return persistedAddressType;
}

export class AddressResourceId {
  @IsUUID(4)
  readonly addressId!: string;
}

export class CreateAddressCommandDto {
  @IsString()
  // TODO: https://stackoverflow.com/questions/68610924/how-to-use-else-condition-in-validationif-decorator-nestjs-class-validator
  readonly value!: string;
  @IsEnum(AddressTypeDto)
  readonly type!: AddressTypeDto;
}

export class PatchAddressCommandDto {
  @IsString()
  @IsOptional()
  // TODO: https://stackoverflow.com/questions/68610924/how-to-use-else-condition-in-validationif-decorator-nestjs-class-validator
  readonly value?: string;
}
