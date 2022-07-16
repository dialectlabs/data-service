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
  CreateDappAddressCommandDto,
  DappAddressDto,
  DappAddressResourceId,
  FindDappAddressesQueryDto,
  PatchDappAddressCommandDto,
} from '../dapp-address/dapp-address.controller.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Address, Dapp, DappAddress, Wallet } from '@prisma/client';
import { PersistedAddressType } from '../address/address.repository';
import { DappAddressService } from '../dapp-address/dapp-address.service';

@ApiTags('Wallet dapp addresses')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'wallets/me/dappAddresses',
  version: '1',
})
export class WalletDappAddressesControllerV1 {
  constructor(
    private readonly dappAddressService: DappAddressService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('/')
  async findAll(
    @AuthPrincipal() { wallet }: Principal,
    @Query() query: FindDappAddressesQueryDto,
  ): Promise<DappAddressDto[]> {
    const dappAddresses = await this.dappAddressService.findAll({
      dapp: {
        publicKey: query.dappPublicKey,
      },
      address: {
        ids: query.addressIds,
        wallet: {
          id: wallet.id,
        },
      },
    });
    return dappAddresses.map((it) => DappAddressDto.from(it));
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
    return DappAddressDto.from(dappAddress);
  }

  @Post('/')
  async create(
    @AuthPrincipal() { wallet }: Principal,
    @Body() command: CreateDappAddressCommandDto,
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
    return DappAddressDto.from(dappAddress);
  }

  /*
  TODO: This code assumes there is only one telegram bot,
   hence only one telegram_chat_id, created at the original /start event from telegram.service.ts.
  */
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
    @Body() command: PatchDappAddressCommandDto,
  ): Promise<DappAddressDto> {
    await this.findOne({ wallet }, { dappAddressId });
    const dappAddress = await this.prisma.dappAddress.update({
      where: {
        id: dappAddressId,
      },
      data: {
        ...(command.enabled !== undefined && { enabled: command.enabled }),
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
    return DappAddressDto.from(dappAddress);
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
