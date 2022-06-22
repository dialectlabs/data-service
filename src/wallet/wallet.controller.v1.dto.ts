import { Wallet } from '@prisma/client';

export class WalletDto {
  readonly id!: string;
  readonly publicKey!: string;
}

export function toWalletDto(wallet: Wallet): WalletDto {
  return {
    id: wallet.id,
    publicKey: wallet.publicKey,
  };
}
