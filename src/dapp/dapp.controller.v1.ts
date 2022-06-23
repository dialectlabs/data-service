import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import { DappAddressDto } from '../dapp-address/dapp-address.controller.dto';
import {
  CreateDappCommand,
  DappDto,
  DappResourceId,
} from './dapp.controller.v1.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DappService } from './dapp.service';

@ApiTags('Dapps')
@Controller({
  path: 'dapps',
  version: '1',
})
@UseGuards(AuthenticationGuard)
@ApiBearerAuth()
export class DappControllerV1 {
  constructor(
    private readonly dappService: DappService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(
    @AuthPrincipal() principal: Principal,
    @Body() command: CreateDappCommand,
  ): Promise<DappDto> {
    DappControllerV1.checkOperationAllowed(command.publicKey, principal);
    const dapp = await this.prisma.dapp.create({
      data: {
        publicKey: command.publicKey,
      },
    });
    return DappDto.from(dapp);
  }

  @Get('/:dappPublicKey')
  async findOne(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
  ): Promise<DappDto> {
    DappControllerV1.checkOperationAllowed(dappPublicKey, principal);
    const dapp = await this.prisma.dapp.findUnique({
      where: {
        publicKey: dappPublicKey,
      },
      rejectOnNotFound: (e) => new NotFoundException(e.message),
    });
    return DappDto.from(dapp);
  }

  @Get(':dappPublicKey/dappAddresses')
  async findAllDappAddresses(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
  ): Promise<DappAddressDto[]> {
    DappControllerV1.checkOperationAllowed(dappPublicKey, principal);
    const dappAddresses = await this.dappService.findDappAdresses(
      dappPublicKey,
    );
    return dappAddresses.map((it) => DappAddressDto.from(it));
  }

  static checkOperationAllowed(dappPublicKey: string, principal: Principal) {
    if (dappPublicKey !== principal.wallet.publicKey) {
      throw new ForbiddenException(
        `Wallet ${principal.wallet.publicKey} not authorized to perform operations for dapp ${dappPublicKey}.`,
      );
    }
  }
}
