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
  import { Wallet } from '@prisma/client';
  import { DappService } from '../dapp/dapp.service';
  import { AuthGuard } from '../auth/auth.guard';
  import { InjectWallet } from '../auth/auth.decorator';
  import { MailService } from '../mail/mail.service';
  import { generateVerificationCode } from 'src/utils';
  import { SmsVerificationService } from 'src/sms/sms.service';
  
  @ApiTags('Api')
  @Controller({
    path: 'api',
    version: '0',
  })
  export class ApiController {
    constructor(
      private readonly prisma: PrismaService,
      private readonly dappService: DappService,
      private readonly mailService: MailService,
      private readonly smsVerificationService: SmsVerificationService,
    ) {}
  
    /**
       Dapp Addresses
       Get a list of addresses on file for a given dapp. Returns the type (e.g. 'email'), and the value (e.g. 'chris@dialect.to'), ONLY if it's verified and enabled.
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
  }