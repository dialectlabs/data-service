import { IsPublicKey } from '../middleware/public-key-validation';
import { Dapp } from '@prisma/client';

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

export function toDappDto(dapp: Dapp): DappDto {
  return {
    publicKey: dapp.publicKey,
    id: dapp.id,
  };
}

export class CreateDappCommand {
  @IsPublicKey()
  readonly publicKey!: string;
}
