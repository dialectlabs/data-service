import { IsPublicKey } from '../middleware/public-key-validation';
import { Dapp } from '@prisma/client';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

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
  @IsNotEmpty()
  readonly name!: string;
  @IsString()
  @IsOptional()
  readonly description?: string;
}

export class DappResourceId {
  @IsPublicKey()
  readonly dappPublicKey!: string;
}

export class FindDappsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  readonly verified?: boolean;
}
