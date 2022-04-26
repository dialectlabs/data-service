import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TelegramService } from './telegram.service';

@Module({
    imports: [PrismaModule, TelegrafModule.forRoot({
        token: '5327432776:AAGHl2BWCHiAaE6NFslnLehg8Q_dUHn8sCQ'
    })],
    providers: [TelegramService],
    exports: [TelegramService]
})

export class TelegramModule {};