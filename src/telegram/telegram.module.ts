import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TelegramService } from './telegram.service';

@Module({
    imports: [PrismaModule, TelegrafModule.forRoot({
        token: String(process.env.TELEGRAM_TOKEN)
    })],
    providers: [TelegramService],
    exports: [TelegramService]
})

export class TelegramModule {};