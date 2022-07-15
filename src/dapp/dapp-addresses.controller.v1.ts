import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import {
  DappAuthPrincipal,
  DappPrincipal,
} from '../auth/authenticaiton.decorator';
import { DappAddressDto } from '../dapp-address/dapp-address.controller.dto';
import { DappResourceId } from './dapp.controller.dto';
import { checkPrincipalAuthorizedToUseDapp } from './dapp.service';
import { DappAddressService } from '../dapp-address/dapp-address.service';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';

@ApiTags('Dapp addresses')
@Controller({
  path: 'dapps',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthenticationGuard, DappAuthenticationGuard)
export class DappAddressesControllerV1 {
  constructor(private readonly dappAddressService: DappAddressService) {}

  @Get(':dappPublicKey/dappAddresses')
  async findAllDappAddresses(
    @DappAuthPrincipal() principal: DappPrincipal,
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
