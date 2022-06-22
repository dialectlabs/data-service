import { IsPublicKey } from '../middleware/public-key-validation';
import { Dapp } from '@prisma/client';

export class DappDto {
  id!: string;
  publicKey!: string;

  static from(dapp: Dapp): DappDto {
    return {
      publicKey: dapp.publicKey,
      id: dapp.id,
    };
  }
}

export class CreateDappCommand {
  @IsPublicKey()
  readonly publicKey!: string;
}

export class DappResourceId {
  @IsPublicKey()
  readonly dappPublicKey!: string;
}
