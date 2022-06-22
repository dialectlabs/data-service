import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import {
  AddressDto,
  AddressResourceId,
  CreateAddressCommandDto,
  PatchAddressCommandDto,
} from '../address/address.controller.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyAddressCommandDto } from './wallet-addresses.controller.v1.dto';
import { AddressService } from '../address/address.service';

// https://stackoverflow.com/questions/35719797/is-using-magic-me-self-resource-identifiers-going-against-rest-principles
@ApiTags('Wallet address')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'wallets/me/addresses',
  version: '1',
})
export class WalletAddressesControllerV1 {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addressService: AddressService,
  ) {}

  @Get('/')
  async findAll(@AuthPrincipal() { wallet }: Principal): Promise<AddressDto[]> {
    const addresses = await this.addressService.findAll(wallet.id);
    return addresses.map((it) => AddressDto.from(it));
  }

  @Get('/:addressId')
  async findOne(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
  ): Promise<AddressDto> {
    const address = await this.addressService.findOne(addressId, wallet.id);
    return AddressDto.from(address);
  }

  @Post('/')
  async create(
    @AuthPrincipal() { wallet }: Principal,
    @Body() command: CreateAddressCommandDto,
  ): Promise<AddressDto> {
    const addressCreated = await this.addressService.create(command, wallet);
    return AddressDto.from(addressCreated);
  }

  @Patch('/:addressId')
  async patch(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
    @Body() command: PatchAddressCommandDto,
  ): Promise<AddressDto> {
    const address = await this.addressService.patch(addressId, command, wallet);
    return AddressDto.from(address);
  }

  @Delete('/:addressId')
  async delete(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
  ) {
    await this.addressService.delete(addressId, wallet.id);
  }

  @Post('/:addressId/verify')
  async verify(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
    @Body() command: VerifyAddressCommandDto,
  ): Promise<AddressDto> {
    const address = await this.addressService.verify(
      addressId,
      command,
      wallet,
    );
    return AddressDto.from(address);
  }

  @Post('/:addressId/resendVerificationCode')
  @HttpCode(204)
  async resendVerificationCode(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
  ): Promise<void> {
    await this.addressService.resendVerificationCode(addressId, wallet);
  }
}
