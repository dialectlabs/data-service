import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wallet } from '@prisma/client';
import { DappService, FindDappQuery } from '../dapp-catalog/dapp.service';

export interface FindDappMessageQuery {
  dapp: FindDappQuery;
  wallet: Wallet;
  skip: number;
  take: number;
}

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dappService: DappService,
  ) {}

  async findAllDappMessages(query: FindDappMessageQuery) {
    const dapps = await this.dappService.findAll(query.dapp);
    const dappPublicKeyToDapp = Object.fromEntries(
      dapps.map((it) => [it.publicKey, it]),
    );
    return this.prisma.message.findMany({
      where: {
        dialect: {
          members: {
            some: {
              walletId: query.wallet.id,
            },
            every: {
              wallet: {
                publicKey: {
                  in: [
                    ...Object.keys(dappPublicKeyToDapp),
                    query.wallet.publicKey,
                  ],
                },
              },
            },
          },
        },
        member: {
          wallet: {
            publicKey: {
              in: Object.keys(dappPublicKeyToDapp),
            },
          },
        },
      },
      include: {
        member: {
          include: {
            wallet: true,
          },
        },
      },
      skip: query.skip,
      take: query.take,
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}
