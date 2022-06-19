import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { DappService } from './dapp.service';
import { PublicKeyValidationPipe } from '../middleware/public-key-validation';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import {
  DappAddressDto,
  toDappAddressDto,
} from '../dapp-addresses/dapp-address.controller.dto';
import {
  CreateDappCommand,
  DappDto,
  toDappDto,
} from './dapp.controller.v1.dto';

@ApiTags('Dapps')
@Controller({
  path: 'dapps',
  version: '1',
})
export class DappControllerV1 {
  constructor(private readonly dappService: DappService) {}

  @Post()
  @UseGuards(AuthenticationGuard)
  async create(
    @AuthPrincipal() principal: Principal,
    @Body() command: CreateDappCommand,
  ): Promise<DappDto> {
    DappControllerV1.checkOperationAllowed(command.publicKey, principal);
    const dapp = await this.dappService.create(command.publicKey);
    return toDappDto(dapp);
  }

  @Get(':public_key/dappAddresses')
  @UseGuards(AuthenticationGuard, DappAuthenticationGuard)
  async dappAddresses(
    @AuthPrincipal() principal: Principal,
    @Param('public_key', PublicKeyValidationPipe) dappPublicKey: string,
  ): Promise<DappAddressDto[]> {
    DappControllerV1.checkOperationAllowed(dappPublicKey, principal);
    const dappAddresses = await this.dappService.findDappAdresses(
      dappPublicKey,
    );
    return dappAddresses.map((it) => toDappAddressDto(it));
  }

  private static checkOperationAllowed(
    dappPublicKey: string,
    principal: Principal,
  ) {
    if (dappPublicKey !== principal.wallet.publicKey) {
      throw new ForbiddenException(
        `Not authorized to perform operations for dapp ${dappPublicKey}.`,
      );
    }
  }
}
