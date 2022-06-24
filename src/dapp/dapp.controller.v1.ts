import {
  Body,
  Controller,
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
import { checkPrincipalAuthorizedToUseDapp } from './dapp.service';
import { DappAddressService } from '../dapp-address/dapp-address.service';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';

@ApiTags('Dapps')
@Controller({
  path: 'dapps',
  version: '1',
})
@ApiBearerAuth()
export class DappControllerV1 {
  constructor(
    private readonly dappAddressService: DappAddressService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(AuthenticationGuard)
  async create(
    @AuthPrincipal() principal: Principal,
    @Body() command: CreateDappCommand,
  ): Promise<DappDto> {
    checkPrincipalAuthorizedToUseDapp(principal, command.publicKey);
    const dapp = await this.prisma.dapp.create({
      data: {
        publicKey: command.publicKey,
      },
    });
    return DappDto.from(dapp);
  }

  @Get(':dappPublicKey')
  @UseGuards(AuthenticationGuard, DappAuthenticationGuard)
  async findOne(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
  ): Promise<DappDto> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    const dapp = await this.prisma.dapp.findUnique({
      where: {
        publicKey: dappPublicKey,
      },
      rejectOnNotFound: (e) => new NotFoundException(e.message),
    });
    return DappDto.from(dapp);
  }

  @Get(':dappPublicKey/dappAddresses')
  @UseGuards(AuthenticationGuard, DappAuthenticationGuard)
  async findAllDappAddresses(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
  ): Promise<DappAddressDto[]> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    const dappAddresses = await this.dappAddressService.findAll({
      dapp: {
        publicKey: dappPublicKey,
      },
    });
    return dappAddresses.map((it) => DappAddressDto.from(it));
  }
}
