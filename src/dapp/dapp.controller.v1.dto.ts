import { IsPublicKey } from '../middleware/public-key-validation';
import { Dapp } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class DappDto {
  id!: string;
  name!: string;
  description?: string;
  publicKey!: string;
  verified!: boolean;

  static from(dapp: Dapp): DappDto {
    return {
      id: dapp.id,
      name: dapp.name,
      description: dapp.description ?? undefined,
      publicKey: dapp.publicKey,
      verified: dapp.verified,
    };
  }
}

export class CreateDappCommandDto {
  @IsPublicKey()
  readonly publicKey!: string;
  @IsString()
  readonly name!: string;
  @IsString()
  @IsOptional()
  readonly description?: string;
}

export class DappResourceId {
  @IsPublicKey()
  readonly dappPublicKey!: string;
}
