import { Injectable } from '@nestjs/common';
import { DappAddress, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FindAddressQuery } from '../address/address.service';
import { FindDappQuery } from '../dapp/dapp.service';

export interface FindDappAddressesQuery {
  enabled?: boolean;
  dapp?: FindDappQuery;
  address?: FindAddressQuery;
}

@Injectable()
export class DappAddressService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindDappAddressesQuery) {
    const findAddressQuery = query.address;
    const findWalletQuery = query.address?.wallet;
    const findDappQuery = query.dapp;
    return this.prisma.dappAddress.findMany({
      where: {
        ...(query.enabled !== undefined && { enabled: query.enabled }),
        ...(findAddressQuery && {
          address: {
            ...(findAddressQuery.ids && {
              id: {
                in: findAddressQuery.ids,
              },
            }),
            ...(findAddressQuery.verified && {
              verified: findAddressQuery.verified,
            }),
            ...(findWalletQuery && {
              wallet: {
                ...(findWalletQuery.id && {
                  id: findWalletQuery.id,
                }),
                ...(findWalletQuery.publicKeys && {
                  publicKey: {
                    in: findWalletQuery.publicKeys,
                  },
                }),
              },
            }),
          },
        }),
        ...(findDappQuery && {
          dapp: {
            ...(findDappQuery.publicKey && {
              publicKey: findDappQuery.publicKey,
            }),
          },
        }),
      },
      include: {
        dapp: true,
        address: {
          include: {
            wallet: true,
          },
        },
      },
    });
  }
}

export function extractTelegramChatId(
  dappAddress: DappAddress,
): string | undefined {
  if (!dappAddress.metadata) {
    return;
  }
  const metadata = dappAddress.metadata as Prisma.JsonObject;
  if (metadata.telegram_chat_id) {
    return metadata.telegram_chat_id as string;
  }
}
