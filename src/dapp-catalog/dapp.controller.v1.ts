import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import { DappAddressDto } from '../dapp-address/dapp-address.controller.dto';
import {
  CreateDappCommandDto,
  DappDto,
  DappResourceId,
  FindDappsQueryDto,
} from './dapp.controller.v1.dto';
import { checkPrincipalAuthorizedToUseDapp, DappService } from './dapp.service';
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
    private readonly dappService: DappService,
  ) {}

  @Post()
  @UseGuards(AuthenticationGuard)
  async create(
    @AuthPrincipal() principal: Principal,
    @Body() command: CreateDappCommandDto,
  ): Promise<DappDto> {
    checkPrincipalAuthorizedToUseDapp(principal, command.publicKey);
    const dapp = await this.dappService.create(command);
    return DappDto.from(dapp);
  }

  @Get()
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: FindDappsQueryDto,
  ): Promise<DappDto[]> {
    const dapps = await this.dappService.findAll(query);
    return dapps.map((dapp) => DappDto.from(dapp));
  }

  @Get(':dappPublicKey')
  @UseGuards(AuthenticationGuard, DappAuthenticationGuard)
  async findOne(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
  ): Promise<DappDto> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    const dapp = await this.dappService.findOne(dappPublicKey);
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
