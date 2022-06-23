import { PrismaService } from '../prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Principal } from '../auth/authenticaiton.decorator';

export interface FindDappQuery {
  publicKey?: string;
}

@Injectable()
export class DappService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(dappPublicKey: string) {
    return this.prisma.dapp.findUnique({
      where: {
        publicKey: dappPublicKey,
      },
      rejectOnNotFound: (e) => new NotFoundException(e.message),
    });
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
