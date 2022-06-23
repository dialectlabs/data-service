import { PrismaService } from '../prisma/prisma.service';
import { PublicKey } from '@solana/web3.js';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Dapp } from '@prisma/client';
import { Principal } from '../auth/authenticaiton.decorator';

export interface FindDappQuery {
  publicKey?: string;
}

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

  async create(publicKey: string) {
    return this.prisma.dapp.create({
      data: {
        publicKey,
      },
    });
  }
}

export function checkPrincipalAuthorizedToUseDapp(
  principal: Principal,
  dappPublicKey: string,
) {
  if (dappPublicKey !== principal.wallet.publicKey) {
    throw new ForbiddenException(
      `Wallet ${principal.wallet.publicKey} not authorized to perform operations for dapp ${dappPublicKey}.`,
    );
  }
}
