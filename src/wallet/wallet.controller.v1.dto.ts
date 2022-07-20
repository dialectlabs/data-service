import { Wallet } from '@prisma/client';

export class WalletDto {
  readonly id!: string;
  readonly publicKey!: string;

  static from(wallet: Wallet) {
    return {
      id: wallet.id,
      publicKey: wallet.publicKey,
    };
  }
}
