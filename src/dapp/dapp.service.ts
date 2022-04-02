import { PrismaService } from '../prisma/prisma.service';
import { PublicKey } from '@solana/web3.js';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Dapp } from '@prisma/client';

@Injectable()
export class DappService {
  constructor(private readonly prisma: PrismaService) {}

  async lookupDapp(dappPublicKey: string) {
    try {
      new PublicKey(dappPublicKey);
    } catch (e: any) {
      throw new HttpException(
        `Invalid format dapp public_key ${dappPublicKey}, please check your inputs and try again.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const dapp_: Dapp | null = await this.prisma.dapp.findUnique({
      where: {
        publicKey: dappPublicKey,
      },
    });
    if (!dapp_)
      throw new HttpException(
        `Unrecognized dapp '${dappPublicKey}'. Please provide a valid dapp and try again`,
        HttpStatus.BAD_REQUEST,
      );
    return dapp_;
  }
}
