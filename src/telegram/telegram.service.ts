import { Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { Address } from '@prisma/client';
import { Telegraf } from 'telegraf';

export abstract class TelegramService {
  abstract send(telegramId: string, body: string): Promise<void>;
}

export class NoopTelegramService extends TelegramService {
  private readonly logger = new Logger(NoopTelegramService.name);

  constructor() {
    super();
    this.logger.warn(
      `Using ${NoopTelegramService.name} to send verification codes: real telegram bot not started`,
    );
  }

  send(telegramId: string, body: string): Promise<void> {
    this.logger.log(`Sending ${body} to ${telegramId}`);
    return Promise.resolve();
  }
}

@Update()
export class TelefrafTelegramService extends TelegramService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectBot() private bot: Telegraf,
  ) {
    super();
  }

  async send(telegramId: string, body: string) {
    try {
      const res = this.bot.telegram.sendMessage(telegramId, body);
      // avoid this on production. use log instead :)
      console.log(`Telegram message sent to ${res}`);
    } catch (e: any) {
      console.log('Error sending Telegram message:', e);
    }
  }

  @Start()
  async start(@Ctx() ctx: any) {
    const username = ctx.update.message.from.username;
    const addresses = await this.findAllUserAddresses(username);
    if (addresses.length === 0) {
      await ctx.reply(
        'Your username is not registered in the system, please subscribe to notifications before using the bot.',
      );
      return;
    }

    const addressToBeVerified =
      TelefrafTelegramService.findAddressToBeVerified(addresses);
    if (!addressToBeVerified) {
      await ctx.reply(
        'Your username is already registered in the system and verified.',
      );
      return;
    }

    const dapps = await this.findDappsAssociatedWith(ctx.botInfo.id);
    if (dapps.length === 0) {
      await ctx.reply('Dapps associated with this bot not found.');
      return;
    }

    const dappIds = dapps.map((dapp) => dapp.id);
    const dappAddresses = await this.prisma.dappAddress.findMany({
      where: {
        addressId: addressToBeVerified.id,
        dappId: { in: dappIds },
      },
    });
    if (dappAddresses.length === 0) {
      await ctx.reply('Your username is not associated with any Dapp.');
      return;
    }
    const dappAddressIds = dappAddresses.map(
      (dappAddress) => dappAddress.addressId,
    );

    await this.prisma.dappAddress.updateMany({
      where: {
        addressId: { in: dappAddressIds },
      },
      data: {
        metadata: {
          // N.b. .from.id is named as a chat_id, but in Telegram, for 1:1 messaging, the chat_id is equivalent to the (sender) user id. https://core.telegram.org/bots/api#getchat.
          telegram_chat_id: ctx.update.message.from.id.toString(),
        },
      },
    });

    await ctx.reply(
      `Welcome to dialect.\nHere is your verification code: ${addressToBeVerified.verificationCode}`,
    );
  }

  private findAllUserAddresses(username: string) {
    return this.prisma.address.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      where: {
        value: username,
        type: 'telegram',
      },
    });
  }

  private static findAddressToBeVerified(
    addresses: Address[],
  ): Address | undefined {
    return addresses.filter(({ verified }) => !verified)[0];
  }

  private findDappsAssociatedWith(botId: any) {
    return this.prisma.dapp.findMany({
      where: {
        telegramKey: {
          contains: `${botId.toString()}:`,
        },
      },
    });
  }
}
