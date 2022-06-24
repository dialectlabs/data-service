import { Injectable } from '@nestjs/common';
import {
  BroadcastNotificationCommand,
  MulticastNotificationCommand,
  UnicastNotificationCommand,
} from './dapp-notifications.controller.dto';
import { Address, Dapp, DappAddress, Wallet } from '@prisma/client';
import { PersistedAddressType } from '../address/address.repository';
import { DappService } from './dapp.service';
import { TelegramService } from '../telegram/telegram.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { PrismaService } from '../prisma/prisma.service';
import { DialectService } from '../dialect/dialect.service';
import {
  DappAddressService,
  extractTelegramChatId,
} from '../dapp-address/dapp-address.service';

interface SendNotificationCommand {
  title: string;
  message: string;
  receivers: (DappAddress & {
    dapp: Dapp;
    address: Address & { wallet: Wallet };
  })[];
  dappPublicKey: string;
}

@Injectable()
export class DappNotificationsService {
  constructor(
    private readonly dappService: DappService,
    private readonly dappAddress: DappAddressService,
    private readonly telegram: TelegramService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
    private readonly dialect: DialectService,
    private readonly prisma: PrismaService,
  ) {}

  async unicast(command: UnicastNotificationCommand, dappPublicKey: string) {
    const receivers = await this.dappAddress.findAll({
      dapp: {
        publicKey: dappPublicKey,
      },
      enabled: true,
      address: {
        verified: true,
        wallet: {
          publicKeys: [command.receiverPublicKey],
        },
      },
    });
    return this.send({
      ...command,
      dappPublicKey,
      receivers,
    });
  }

  async multicast(
    command: MulticastNotificationCommand,
    dappPublicKey: string,
  ) {
    const receivers = await this.dappAddress.findAll({
      dapp: {
        publicKey: dappPublicKey,
      },
      enabled: true,
      address: {
        verified: true,
        wallet: {
          publicKeys: command.receiverPublicKeys,
        },
      },
    });
    return this.send({
      ...command,
      dappPublicKey,
      receivers,
    });
  }

  async broadcast(
    command: BroadcastNotificationCommand,
    dappPublicKey: string,
  ) {
    const receivers = await this.dappAddress.findAll({
      dapp: {
        publicKey: dappPublicKey,
      },
      enabled: true,
      address: {
        verified: true,
      },
    });
    return this.send({
      ...command,
      dappPublicKey,
      receivers,
    });
  }

  async send(command: SendNotificationCommand) {
    const title = command.title;
    const message = command.message;
    return Promise.allSettled(
      command.receivers.map(async (da) => {
        switch (da.address.type as PersistedAddressType) {
          case 'telegram':
            const telegramChatId = extractTelegramChatId(da);
            return (
              telegramChatId && this.telegram.send(telegramChatId, message)
            );
          case 'email':
            return this.mail.send(da.address.value, title, message);
          case 'sms':
            return this.sms.send(da.address.value, message);
        }
      }),
    );
  }
}
