// TODO: Enforce UUID format in some kind of middleware exception handling.
// Consolidate exception handling into single wrapper
import {
    Body,
    Controller,
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
import { BasicAuthGuard } from 'src/auth/basic-auth.guard';
import { PublicKey } from '@solana/web3.js';

  export interface Web2Subscriber {
    resourceId: PublicKey;
    email?: string;
    telegramId?: string; // "<username>;<chat_id>"
    smsNumber?: string;
  }

  @UseGuards(BasicAuthGuard)
  @ApiTags('Web2Scubscribers')
  @Controller({
    path: 'web2Subscriber',
    version: '0',
  })
  export class Web2SubscriberController {
    constructor(
      private readonly prisma: PrismaService,
    ) {}
  
    /**
       Dapp Addresses
       Query all address for a given dapp and arrange as web2Subscriber dto
       Get a list of addresses on file for a given dapp. Returns the wallet publickey, type (e.g. 'email'), and value (e.g. 'chris@dialect.to'), ONLY if it's verified and enabled.
       */
    @Get('all')
    async get(
      @Param('dapp') dappPublicKey: string,
    ): Promise<Web2Subscriber[]> {
      let web2Subs: Web2Subscriber[] = [];

      // get all verified address records subscribed to the dapp
      const subscriberAddresses = this.prisma.address.findMany({
        where: {
          dappAddresses: {
            some: {
              dapp: {
                publicKey: dappPublicKey,
              }
            }
          },
          verified: true,
        }
      });

      (await subscriberAddresses).forEach(async (address) => {
        const wallet = await this.prisma.wallet.findUnique({
          where: {
            id: address.walletId,
          }
        });

        if (wallet) {
          const idx = web2Subs.findIndex((sub) => sub.resourceId.toString() == wallet?.publicKey); // TODO resourceId.toString()/base58() ?
          if (idx) {
            // update for this address type
            address.type == 'email' ? web2Subs[idx].email = address.value :
             address.type == 'sms' ? web2Subs[idx].smsNumber = address.value :
             address.type == 'telegram' ? web2Subs[idx].telegramId = address.value : '';
            
          } else {
            // create with this address type
            let web2Subscriber: Web2Subscriber = { resourceId: new PublicKey(wallet.publicKey) };
            address.type == 'email' ? web2Subscriber.email = address.value :
             address.type == 'sms' ? web2Subscriber.smsNumber = address.value :
             address.type == 'telegram' ? web2Subscriber.telegramId = address.value : '';
            web2Subs.push(web2Subscriber);
          }
        }
      });
      
      return web2Subs;
    }
  }