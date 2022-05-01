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

@ApiTags('Web2Scubscribers')
@UseGuards(BasicAuthGuard)
@Controller({
  path: 'web2Subscriber',
  version: '0',
})
export class Web2SubscriberController {
  constructor(private readonly prisma: PrismaService) {}

  /**
       Dapp Addresses
       Query all address for a given dapp and arrange as web2Subscriber dto
       Get a list of addresses on file for a given dapp. Returns the wallet publickey, type (e.g. 'email'), and value (e.g. 'chris@dialect.to'), ONLY if it's verified and enabled.

       */
  @Get('all/:dapp')
  async get(@Param('dapp') dappPublicKey: string): Promise<Web2Subscriber[]> {
    const web2Subs: Web2Subscriber[] = [];

    // get all verified address records subscribed to the dapp
    // const subscriberAddresses = await this.prisma.address.findMany({
    //   where: {
    //     dappAddresses: {
    //       some: {
    //         dapp: {
    //           publicKey: dappPublicKey,
    //         },
    //       },
    //     },
    //     verified: true,
    //   },
    // });

    const subscriberDappAddresses = await this.prisma.dappAddress.findMany({
      where: {
        enabled: true,
        address: {
          verified: true,
        },
        dapp: {
          publicKey: dappPublicKey,
        }
      },
      include: {
        address: true,
      },
    });

    const results = await Promise.all(
      subscriberDappAddresses.map(sda => sda.address).map(async (address) => {
        const wallet = await this.prisma.wallet.findUnique({
          where: { id: address.walletId },
        });

        const dapp = await this.prisma.dappAddress.findFirst({
          where: {
            addressId: address.id,
          },
        });

        return { ...wallet, address, dapp };
      }),
    );

    results.forEach((wallet) => {
      if (wallet) {
        const idx = web2Subs.findIndex(
          (sub) => sub.resourceId.toString() == wallet?.publicKey,
        ); // TODO resourceId.toString()/base58() ?
        if (idx != -1) {
          // update for this address type
          wallet.address.type == 'email'
            ? (web2Subs[idx].email = wallet.address.value)
            : wallet.address.type == 'sms'
            ? (web2Subs[idx].smsNumber = wallet.address.value)
            : wallet.address.type == 'telegram'
            ? (web2Subs[idx].telegramId = wallet.dapp?.metadata?.telegram_chat_id || undefined)
            : undefined;
        } else {
          // create with this address type
          const web2Subscriber: Web2Subscriber = {
            resourceId: new PublicKey(wallet.publicKey || ''),
          };
          wallet.address.type == 'email'
            ? (web2Subscriber.email = wallet.address.value)
            : wallet.address.type == 'sms'
            ? (web2Subscriber.smsNumber = wallet.address.value)
            : wallet.address.type == 'telegram'
            ? (web2Subscriber.telegramId = wallet.dapp?.metadata?.telegram_chat_id || undefined)
            : undefined;
          web2Subs.push(web2Subscriber);
        }
      }
    });

    return web2Subs;
  }
}
