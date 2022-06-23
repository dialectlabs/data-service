import { Injectable } from '@nestjs/common';
import { SendNotificationCommand } from './dapp-notifications.controller.dto';
import { Address, DappAddress, Prisma } from '@prisma/client';
import { PersistedAddressType } from '../address/address.repository';
import { DappService } from './dapp.service';
import { TelegramService } from '../telegram/telegram.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DappNotificationsService {
  constructor(
    private readonly dappService: DappService,
    private readonly telegram: TelegramService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
    private readonly prisma: PrismaService,
  ) {}

  async send(dappPublicKey: string, command: SendNotificationCommand) {
    const dapp = await this.dappService.lookupDapp(dappPublicKey);
    const title = command.title;
    const message = command.message;

    let addressQuery;
    if (title) {
      // omit all wallets since this is handled client side for now
      addressQuery = {
        NOT: {
          type: 'wallet',
        },
        verified: true,
      };
    } else {
      // if no title, omit email address types
      addressQuery = {
        NOT: {
          OR: [{ type: 'wallet' }, { type: 'email' }],
        },
        verified: true,
      };
    }

    const dappAddresses = await this.prisma.dappAddress.findMany({
      where: {
        dappId: dapp.id,
        enabled: true,
        address: addressQuery,
      },
      include: {
        address: true,
      },
    });

    await Promise.all(
      dappAddresses.map(async (da: DappAddress & { address: Address }) => {
        switch (da.address.type as PersistedAddressType) {
          case 'telegram':
            // TODO: Hide this stuff in a object method.
            const metadata = da.metadata as Prisma.JsonObject;
            const chat_id: Prisma.JsonValue | undefined =
              metadata['telegram_chat_id'];
            if (!chat_id || typeof chat_id !== 'string') break;
            await this.telegram.send(chat_id, message);
            break;
          case 'email':
            if (!title) break; // should never happen because of query above
            await this.mail.send(da.address.value, title, message);
            break;
          case 'sms':
            await this.sms.send(da.address.value, message);
            break;
          case 'wallet':
            // noop, for now
            break;
          default:
            break;
        }
      }),
    );
  }
}
