import {
    Update,
    Ctx,
    Start,
    Help,
  } from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

 
  @Update()
  export class TelegramService {
    constructor(private readonly prisma: PrismaService) {}

    @Start()
    async start(@Ctx() ctx: any) {  
        const addresses = await this.prisma.address.findMany({
            orderBy: [{updatedAt: "desc"}],
            where: {
                value: ctx.update.message.from.usernam,
                verified: false 
            }
        });
        
        if (!addresses[0]) {
            await ctx.reply("We can't find any telegram address attached to the wallet")
        }

        await ctx.reply(`Welcome to dialect, ${ctx.update.message.from.first_name}.\nHere is your verification code: ${addresses[0].verificationCode}`);
    }
  
    @Help()
    async help(@Ctx() ctx: any) {
      //await ctx.reply('Send me a sticker');
    }
  }