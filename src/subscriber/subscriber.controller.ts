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
import { json } from 'stream/consumers';

export interface Subscriber {
  resourceId: PublicKey;
  email?: string;
  telegramId?: string;
  smsNumber?: string;
}

@ApiTags('Dapps')
@UseGuards(BasicAuthGuard)
@Controller({
  path: 'dapps',
  version: '0',
})
export class SubscriberController {
  constructor(private readonly prisma: PrismaService) {}

  /**
       Dapp Subscriber Addresses
       Query all addresses for a given dapp and arrange by Subscriber
       Returns addresses ONLY if verified and enabled.
       e.g. GET /v0/api/dapps/:dapp/subscribers
       */
  @Get(':dapp/subscribers')
  async get(@Param('dapp') dappPublicKey: string): Promise<Subscriber[]> {
    const subscribers: Subscriber[] = [];

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
        const idx = subscribers.findIndex(
          (sub) => sub.resourceId.toString() == wallet?.publicKey,
        );
        if (idx != -1) {
          // update for this address type
          wallet.address.type == 'email'
            ? (subscribers[idx].email = wallet.address.value)
            : wallet.address.type == 'sms'
            ? (subscribers[idx].smsNumber = wallet.address.value)
            : wallet.address.type == 'telegram'
            // @ts-ignore
            ? (subscribers[idx].telegramId = wallet.dapp?.metadata?.telegram_chat_id || undefined)
            : undefined;
        } else {
          // create with this address type
          const subscriber: Subscriber = {
            resourceId: new PublicKey(wallet.publicKey || ''),
          };
          wallet.address.type == 'email'
            ? (subscriber.email = wallet.address.value)
            : wallet.address.type == 'sms'
            ? (subscriber.smsNumber = wallet.address.value)
            : wallet.address.type == 'telegram'
            // @ts-ignore
            ? (subscriber.telegramId = wallet.dapp?.metadata?.telegram_chat_id || undefined)
            : undefined;
          subscribers.push(subscriber);
        }
      }
    });

    return subscribers;
  }
}