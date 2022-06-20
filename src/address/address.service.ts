import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(walletId: string) {
    return this.prisma.address.findMany({
      where: {
        walletId,
      },
      include: {
        wallet: true,
      },
    });
  }

  findOne(addressId: string, walletId: string) {
    return this.prisma.address.findUnique({
      where: {
        walletId_id: {
          walletId,
          id: addressId,
        },
      },
      include: {
        wallet: true,
      },
      rejectOnNotFound: (e) => new NotFoundException(e.message),
    });
  }
}
