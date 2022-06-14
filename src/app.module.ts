import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { DappModule } from './dapp/dapp.module';
import { MailModule } from './mail/mail.module';
import { SmsVerificationModule } from './sms/sms.module';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { DialectModule } from './dialect/dialect.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        customLogLevel: (_, res) => {
          if (res.statusCode && res.statusCode >= 400) {
            return 'error';
          }
          if (process.env.ENVIRONMENT !== 'production') {
            return 'info';
          }
          return 'silent';
        },
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: process.env.ENVIRONMENT === 'local-development',
            translateTime: true,
            singleLine: true,
            ignore: 'pid,hostname',
          },
        },
      },
    }),
    PrismaModule,
    WalletModule,
    DappModule,
    MailModule,
    SmsVerificationModule,
    TelegramModule,
    DialectModule,
  ],
  providers: [],
})
export class AppModule {}
