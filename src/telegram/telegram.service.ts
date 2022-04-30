import { Wallet } from '@project-serum/anchor';
import { Update, Ctx, Start, Help } from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Update()
export class TelegramService {
  constructor(private readonly prisma: PrismaService) {}

  @Start()
  async start(@Ctx() ctx: any) {
    const addresses = await this.prisma.address.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      where: {
        value: ctx.update.message.from.username,
        type: 'telegram',
        verified: false,
      },
    });

    if (!addresses[0]) {
      await ctx.reply(
        "You're already receiving notifications or your wallet not attached",
      );
      return;
    }

    const dapps = await this.prisma.dapp.findMany({
      where: {
        telegramKey: {
          contains: `${ctx.botInfo.id.toString()}:`,
        },
      },
    });

    if (dapps.length === 0) {
      await ctx.reply('Dapp assosiated with this bot not registred');
      return;
    }

    const dappIds = dapps.map((dapp) => dapp.id);

    const dappAddresses = await this.prisma.dappAddress.findMany({
      where: {
        addressId: addresses[0].id,
        dappId: { in: dappIds },
      },
    });

    if (dappAddresses.length === 0) {
      await ctx.reply('Not address asosiated with this Dapp');
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
        metadata: ctx.update.message.from.id.toString(),
      },
    });

    await ctx.reply(
      `Welcome to dialect, ${ctx.update.message.from.first_name}.\nHere is your verification code: ${addresses[0].verificationCode}`,
    );
  }
}
