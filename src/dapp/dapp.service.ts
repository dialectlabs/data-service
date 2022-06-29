import { PrismaService } from '../prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Principal } from '../auth/authenticaiton.decorator';
import { CreateDappCommandDto } from './dapp.controller.v1.dto';

export interface FindDappQuery {
  publicKey?: string;
  verified?: boolean;
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

  create(command: CreateDappCommandDto) {
    return this.prisma.dapp.create({
      data: {
        publicKey: command.publicKey,
        name: command.name,
        description: command.description,
        verified: false,
      },
    });
  }

  async findAll(query: FindDappQuery) {
    return this.prisma.dapp.findMany({
      where: {
        ...(query.publicKey && { publicKey: query.publicKey }),
        ...(query.verified && { verified: query.verified }),
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
