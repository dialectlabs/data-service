// TODO: Enforce UUID format in some kind of middleware exception handling.
// Consolidate exception handling into single wrapper
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import {
  DappAddressDto,
  PostDappAddressDto,
  PutDappAddressDto,
  VerifyAddressDto,
} from './wallet.controller.dto';
import { Wallet } from '@prisma/client';
import { DappService } from '../dapp/dapp.service';
import { AuthGuard } from '../auth/auth.guard';
import { InjectWallet } from '../auth/auth.decorator';
import { MailService } from '../mail/mail.service';

@ApiTags('Wallets')
@Controller({
  path: 'wallets',
  version: '0',
})
export class WalletController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dappService: DappService,
    private readonly mailService: MailService,
  ) {}

  /**
     Addresses
     Delete an address. N.b. this will delete all corresponding dapp address configurations.
     */
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Delete(':public_key/addresses/:id')
  async delete(
    @Param('public_key') publicKey: string,
    @Param('id') id: string,
    @InjectWallet() wallet: Wallet,
  ) {
    // TODO: Resolve return type
    // First enforce that the address is owned by the requesting public key.
    const addresses = await this.prisma.address.findMany({
      where: {
        id,
        walletId: wallet.id,
      },
    });
    if (addresses.length < 1)
      throw new HttpException(
        `Unabled to delete address ${id} as it either doesn't exist or is not owned by wallet public key ${publicKey}. Check your inputs and try again.`,
        HttpStatus.BAD_REQUEST,
      );

    // Delete *ALL* dappAddresses associated with a given address
    await this.prisma.dappAddress.deleteMany({
      where: {
        addressId: id,
      },
    });

    // Delete address
    // TODO: Support record does not exist failure
    await this.prisma.address.delete({
      where: {
        id,
      },
    });
  }

  /**
     Dapp Addresses
     Get a list of addresses on file for a given dapp. N.b. this only returns the type (e.g. 'email'), and whether it's verified and enabled; it does *NOT* return the value (e.g. 'chris@dialect.to').
     */
  @Get(':public_key/dapps/:dapp/addresses')
  async get(
    @Param('public_key') publicKey: string,
    @Param('dapp') dappPublicKey: string,
  ): Promise<DappAddressDto[]> {
    const dapp = await this.dappService.lookupDapp(dappPublicKey);
    const dappAddresses = await this.prisma.dappAddress.findMany({
      where: {
        dapp: {
          id: dapp.id,
        },
        address: {
          wallet: {
            publicKey,
          },
        },
      },
      include: {
        address: true,
        dapp: true,
      },
    });
    return dappAddresses.map((dappAddress) => ({
      id: dappAddress.id,
      addressId: dappAddress.address.id,
      type: dappAddress.address.type,
      verified: dappAddress.address.verified,
      dapp: dappAddress.dapp.publicKey,
      enabled: dappAddress.enabled,
    }));
  }

  /**
     Create a new dapp address. N.b. this also handles the following cases for addresses:

     1. Create an address.
     2. Update an address.
     3. Neither create nor update an address.

     In all of the above, the dapp address is being created, hence the POST method type.
     */
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post(':public_key/dapps/:dapp/addresses')
  async post(
    @Param('public_key') publicKey: string,
    @Param('dapp') dappPublicKey: string,
    @InjectWallet() wallet: Wallet,
    @Body() postDappAddressDto: PostDappAddressDto,
  ): Promise<DappAddressDto> {
    const dapp = await this.dappService.lookupDapp(dappPublicKey);
    const addressId = postDappAddressDto.addressId;
    const type = postDappAddressDto.type;
    const value = postDappAddressDto.value;
    const enabled = postDappAddressDto.enabled;

    let address;
    if (!addressId && type && value) {
      /*
                                                            Case 1: Create an address
                                                      
                                                            This is determined by there being no addressId in the payload.
                                                            */
      console.log('POST case 1: Creating an address...');
      /**
       * Generating 6 digit code to approve email
      */

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      try {
        address = await this.prisma.address.create({
          data: {
            type,
            value,
            walletId: wallet.id,
            verficiationCode: code
          }
        });
      } catch (e: any) {
        if (e?.message?.includes('Unique constraint failed'))
          throw new HttpException(
            `Wallet ${publicKey} already has a ${type} address on file. You must therefore supply an addressId to this route.`,
            HttpStatus.BAD_REQUEST,
          );
        throw new HttpException(
          'Something went wrong, please try again or contact support at hello@dialect.to.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.mailService.sendVerificationCode(value, code);

    } else if (value) {
      /**
             Case 2: Address exists and must be updated.
             This is determined by there being an addressId and a value supplied.
             */
      // TODO: Ensure this can't be done by non-owner.
      console.log('POST case 2: Updating an address...');
      await this.prisma.address.updateMany({
        where: {
          id: addressId,
          walletId: wallet.id,
        },
        data: {
          value,
        },
      });

      address = await this.prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address)
        throw new HttpException(
          `Address ${addressId} not found. Check your inputs and try again.`,
          HttpStatus.NOT_FOUND,
        );
    } else {
      /*
                                                                  Case 3: Address does not need to be created or updated.
                                                                  */
      console.log('POST case 3: No address create or update...');
      const addresses = await this.prisma.address.findMany({
        where: {
          id: addressId,
          walletId: wallet.id,
        },
      });

      if (addresses.length < 1)
        throw new HttpException(
          `Could not find address ${addressId} for wallet ${wallet.publicKey}. Check your inputs and try again.`,
          HttpStatus.BAD_REQUEST,
        );
      address = addresses[0];
    }
    let dappAddress;
    try {
      dappAddress = await this.prisma.dappAddress.create({
        data: {
          enabled,
          dappId: dapp.id,
          addressId: address.id,
        },
        include: {
          address: true,
          dapp: true,
        },
      });
    } catch (e: any) {
      console.log('e', e);
      if (e?.message?.includes('Unique constraint failed'))
        throw new HttpException(
          `Wallet ${publicKey} address already has a dapp address on file for dapp '${dapp.publicKey}'. Use the update dapp address route instead.`,
          HttpStatus.BAD_REQUEST,
        );
      throw new HttpException(
        'Something went wrong, please try again or contact support at hello@dialect.to.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      id: dappAddress.id,
      addressId: dappAddress.address.id,
      type: dappAddress.address.type,
      verified: dappAddress.address.verified,
      dapp: dapp.publicKey,
      enabled: dappAddress.enabled,
    };
  }

  /**
     Update a dapp address. N.b. this also handles the following cases for addresses:

     1. Update an address.
     2. Don't update an address.

     In all of the above, the dapp address is being created, hence the POST method type.
     */
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Put(':public_key/dapps/:dapp/addresses/:id')
  async put(
    @Param('id') id: string,
    @Param('public_key') publicKey: string,
    @Param('dapp') dappPublicKey: string,
    @InjectWallet() wallet: Wallet,
    @Body() putDappAddressDto: PutDappAddressDto,
  ): Promise<DappAddressDto> {
    await this.dappService.lookupDapp(dappPublicKey);

    const addressId = putDappAddressDto.addressId;
    const value = putDappAddressDto.value;
    const enabled = putDappAddressDto.enabled;

    if ((!addressId && value) || (addressId && !value))
      throw new HttpException(
        `An addressId (${addressId}) and value (${value}) must either both be supplied, or both be null. Cannot have one null and one non-null. Check your inputs and try again.`,
        HttpStatus.BAD_REQUEST,
      );

    // TODO: Retire to auth middleware

    let address;
    if (addressId && value) {
      /*
                                                                  Case 1: Address must be updated.
                                                            
                                                                  This is determined by addressId & value being supplied.
                                                                  */

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await this.prisma.address.updateMany({
        where: {
          id: addressId,
          walletId: wallet.id,
        },
        data: {
          value,
          verficiationCode: code,
          verified: false
        },
      });


      this.mailService.sendVerificationCode(value, code);

      address = await this.prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address)
        throw new HttpException(
          `Address ${addressId} not found. Check your inputs and try again.`,
          HttpStatus.NOT_FOUND,
        );
    } else {
      /*
                                                                  Case 2: Address does not need to be updated.
                                                                  */
      const addresses = await this.prisma.address.findMany({
        where: {
          id: addressId,
          walletId: wallet.id,
        },
      });

      if (addresses.length < 1)
        throw new HttpException(
          `Could not find address ${addressId} for wallet ${wallet.publicKey}. Check your inputs and try again.`,
          HttpStatus.BAD_REQUEST,
        );
      address = addresses[0];
    }

    // Now handle updating the dapp address
    let dappAddress = await this.prisma.dappAddress.findUnique({
      where: {
        id,
      },
      include: {
        address: true,
        dapp: true,
      },
    });

    if (dappAddress?.address.walletId !== wallet.id)
      throw new HttpException(
        `Could not find dapp address ${id} owned by wallet ${wallet.publicKey}.`,
        HttpStatus.BAD_REQUEST,
      );

    dappAddress = await this.prisma.dappAddress.update({
      where: {
        id,
      },
      data: {
        enabled,
      },
      include: {
        address: true,
        dapp: true,
      },
    });

    return {
      id: dappAddress.id,
      addressId: dappAddress.address.id,
      type: dappAddress.address.type,
      verified: dappAddress.address.verified,
      dapp: dappAddress.dapp.publicKey,
      enabled: dappAddress.enabled,
    };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post(':public_key/dapps/:dapp/addresses/:id/verify')
  async verify(
    @Param('id') id: string,
    @Param('public_key') publicKey: string,
    @Param('dapp') dappPublicKey: string,
    @InjectWallet() wallet: Wallet,
    @Body() verifyAddressDto: VerifyAddressDto,
  ): Promise<any> {
    const dapp = await this.dappService.lookupDapp(dappPublicKey);

    try {
      const address = await this.prisma.address.findUnique({
        where: { id: verifyAddressDto.addressId },
      }); 
    
      if (address?.verficiationCode !== verifyAddressDto.code) {
        throw new HttpException(
          `code: ${verifyAddressDto.code} not valid for ${id}.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.prisma.address.updateMany({
        where: {
          id: verifyAddressDto.addressId,
          walletId: wallet.id,
        },
        data: {
          verified: true,
          verficiationCode: undefined
        },
      }); 

      let dappAddress = await this.prisma.dappAddress.findUnique({
        where: {
          id: id,
        },
        include: {
          address: true,
          dapp: true,
        },
      });
    
      if (dappAddress?.address.walletId !== wallet.id)
        throw new HttpException(
          `Could not find dapp address ${dapp.id} owned by wallet ${wallet.publicKey}.`,
          HttpStatus.BAD_REQUEST,
        );
    
      return {
        id: dappAddress.id,
        addressId: dappAddress.address.id,
        type: dappAddress.address.type,
        verified: dappAddress.address.verified,
        dapp: dappAddress.dapp.publicKey,
        enabled: dappAddress.enabled,
      };
    }
    catch(e) {
      console.log(e);
    }
  }
}

