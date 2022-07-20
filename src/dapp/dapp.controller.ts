import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import {
  CreateDappCommandDto,
  DappDto,
  DappResourceId,
  FindDappsQueryDto,
} from './dapp.controller.dto';
import { checkPrincipalAuthorizedToUseDapp, DappService } from './dapp.service';
import { DappAddressService } from '../dapp-address/dapp-address.service';

@ApiTags('Dapps')
@Controller({
  path: 'dapps',
  version: '1',
})
@ApiBearerAuth()
export class DappController {
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
  @UseGuards(AuthenticationGuard)
  async findAll(@Query() query: FindDappsQueryDto): Promise<DappDto[]> {
    const dapps = await this.dappService.findAll(query);
    return dapps.map((dapp) => DappDto.from(dapp));
  }

  @Get(':dappPublicKey')
  @UseGuards(AuthenticationGuard)
  async findOne(
    @AuthPrincipal() principal: Principal,
    @Param() { dappPublicKey }: DappResourceId,
  ): Promise<DappDto> {
    const dapp = await this.dappService.findOne(dappPublicKey);
    return DappDto.from(dapp);
  }
}
