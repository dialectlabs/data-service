import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  upsert(...publicKey: PublicKey[]) {
    return this.prisma.$transaction(
      publicKey.map((publicKey) =>
        this.prisma.wallet.upsert({
          where: {
            publicKey: publicKey.toBase58(),
          },
          create: {
            publicKey: publicKey.toBase58(),
          },
          update: {},
        }),
      ),
    );
  }
}
