import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
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
} from '../dapp-addresses/dapp-address.controller.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';

// https://stackoverflow.com/questions/35719797/is-using-magic-me-self-resource-identifiers-going-against-rest-principles
@ApiTags('Wallet dapp addresses')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'wallets/me/dappAddresses',
  version: '1',
})
export class WalletDappAddressesControllerV1 {
  @Get('/')
  async findAll(
    @AuthPrincipal() { wallet }: Principal,
    @Query() query: FindDappAddressesQuery,
  ): Promise<DappAddressDto[]> {
    return [];
  }

  @Post('/')
  async create(
    @AuthPrincipal() { wallet }: Principal,
    @Body() command: CreateDappAddressCommand,
  ): Promise<DappAddressDto> {
    throw new UnauthorizedException();
  }

  @Patch('/:dappAddressId')
  async patch(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { dappAddressId }: DappAddressResourceId,
    @Body() command: PatchDappAddressCommand,
  ): Promise<DappAddressDto> {
    throw new UnauthorizedException();
  }
}
