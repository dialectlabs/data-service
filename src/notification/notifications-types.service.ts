import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from './model';

export interface FindNotificationTypesQuery {
  walletIds?: string[];
  dappPublicKey: string;
  notificationTypeId?: string;
}

@Injectable()
export class NotificationsTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: FindNotificationTypesQuery,
  ): Promise<NotificationType[]> {
    const notificationTypes = await this.prisma.notificationType.findMany({
      where: {
        ...(query.notificationTypeId && {
          id: query.notificationTypeId,
        }),
        ...(query.dappPublicKey && {
          dapp: {
            publicKey: query.dappPublicKey,
          },
        }),
      },
      include: {
        dapp: true,
      },
      orderBy: {
        orderingPriority: 'desc',
      },
    });
    return notificationTypes.map(NotificationType.fromNotificationTypeDb);
  }
}
