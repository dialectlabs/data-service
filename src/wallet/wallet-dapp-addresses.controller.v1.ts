import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import {
  CreateDappAddressCommand,
  DappAddressDto,
  DappAddressResourceId,
  FindDappAddressesQuery,
  PatchDappAddressCommand,
  toDappAddressDto,
} from '../dapp-address/dapp-address.controller.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Address, Dapp, DappAddress, Wallet } from '@prisma/client';
import { PersistedAddressType } from '../address/address.repository';

// https://stackoverflow.com/questions/35719797/is-using-magic-me-self-resource-identifiers-going-against-rest-principles
@ApiTags('Wallet dapp address')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'wallets/me/dappAddresses',
  version: '1',
})
export class WalletDappAddressesControllerV1 {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/')
  async findAll(
    @AuthPrincipal() { wallet }: Principal,
    @Query() query: FindDappAddressesQuery,
  ): Promise<DappAddressDto[]> {
    const dappAddressses = await this.prisma.dappAddress.findMany({
      where: {
        address: {
          walletId: wallet.id,
        },
        ...(query.dappPublicKey && {
          dapp: {
            publicKey: query.dappPublicKey,
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
    return dappAddressses.map((it) => toDappAddressDto(it));
  }

  @Get('/:dappAddressId')
  async findOne(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { dappAddressId }: DappAddressResourceId,
  ): Promise<DappAddressDto> {
    const dappAddress = await this.prisma.dappAddress.findFirst({
      where: {
        id: dappAddressId,
        address: {
          walletId: wallet.id,
        },
      },
      include: {
        dapp: true,
        address: {
          include: {
            wallet: true,
          },
        },
      },
      rejectOnNotFound: (e) => new NotFoundException(e.message),
    });
    return toDappAddressDto(dappAddress);
  }

  @Post('/')
  async create(
    @AuthPrincipal() { wallet }: Principal,
    @Body() command: CreateDappAddressCommand,
  ): Promise<DappAddressDto> {
    const dappAddress = await this.prisma.dappAddress.create({
      data: {
        dapp: {
          connect: {
            publicKey: command.dappPublicKey,
          },
        },
        address: {
          connect: {
            walletId_id: {
              id: command.addressId,
              walletId: wallet.id,
            },
          },
        },
        enabled: command.enabled,
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
    if ((dappAddress.address.type as PersistedAddressType) === 'telegram') {
      await this.tryFillTelegramMetadata(dappAddress);
    }
    return toDappAddressDto(dappAddress);
  }

  private async tryFillTelegramMetadata(
    dappAddress: DappAddress & {
      dapp: Dapp;
      address: Address & { wallet: Wallet };
    },
  ) {
    const metadata = await this.findExistingMetadata(dappAddress);
    if (!metadata) {
      return dappAddress;
    }
    return this.prisma.dappAddress.update({
      where: dappAddress,
      data: {
        metadata,
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

  private async findExistingMetadata(
    dappAddress: DappAddress & {
      dapp: Dapp;
      address: Address & { wallet: Wallet };
    },
  ) {
    const existingDappAddressWithNonEmptyMeta =
      await this.prisma.dappAddress.findFirst({
        where: {
          address: {
            walletId: dappAddress.address.walletId,
            type: 'telegram',
          },
          NOT: {
            metadata: undefined,
          },
        },
      });
    const metadata = existingDappAddressWithNonEmptyMeta?.metadata;
    if (!metadata) {
      return null;
    }
    return metadata as Record<string, any>;
  }

  @Patch('/:dappAddressId')
  async patch(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { dappAddressId }: DappAddressResourceId,
    @Body() command: PatchDappAddressCommand,
  ): Promise<DappAddressDto> {
    await this.findOne({ wallet }, { dappAddressId });
    const dappAddress = await this.prisma.dappAddress.update({
      where: {
        id: dappAddressId,
      },
      data: {
        ...(command.enabled && { enabled: command.enabled }),
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
    return toDappAddressDto(dappAddress);
  }

  @Delete('/:dappAddressId')
  async delete(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { dappAddressId }: DappAddressResourceId,
  ) {
    await this.findOne({ wallet }, { dappAddressId });
    await this.prisma.dappAddress.deleteMany({
      where: {
        id: dappAddressId,
        address: {
          walletId: wallet.id,
        },
      },
    });
  }
}
