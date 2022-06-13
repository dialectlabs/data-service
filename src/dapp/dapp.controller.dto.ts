import { IsPublicKey } from '../middleware/public-key-validation';

export class SubscriberDto {
  resourceId!: string;
  email?: string;
  telegramId?: string;
  smsNumber?: string;
}

export class DappDto {
  id!: string;
  publicKey!: string;
}

export class DappAddressDto {
  readonly id!: string;
  readonly enabled!: boolean;
  readonly telegramChatId?: string;
  readonly address!: AddressDto;
}

export class AddressDto {
  readonly id!: string;
  readonly type!: AddressTypeDto;
  readonly verified!: boolean;
  readonly value!: string;
  readonly wallet!: WalletDto;
}

export class WalletDto {
  readonly id!: string;
  readonly publicKey!: string;
}

export enum AddressTypeDto {
  Email = 'EMAIL',
  Sms = 'SMS',
  Telegram = 'TELEGRAM',
  Wallet = 'WALLET',
}

export class CreateDappCommand {
  @IsPublicKey()
  readonly publicKey!: string;
}
