import { DynamicModule, Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaModule } from 'src/prisma/prisma.module';
import {
  NoopTelegramService,
  TelefrafTelegramService,
  TelegramService,
} from './telegram.service';

const telegrafModules: DynamicModule[] =
  process.env.ENVIRONMENT === 'production' || process.env.TELEGRAM_TOKEN
    ? [
        TelegrafModule.forRoot({
          token: String(process.env.TELEGRAM_TOKEN),
        }),
      ]
    : [];

@Module({
  imports: [PrismaModule, ...telegrafModules],
  providers: [
    {
      provide: TelegramService,
      useClass:
        process.env.ENVIRONMENT === 'production' || process.env.TELEGRAM_TOKEN
          ? TelefrafTelegramService
          : NoopTelegramService,
    },
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
