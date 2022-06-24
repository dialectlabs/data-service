import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { DappModule } from './dapp/dapp.module';
import { MailModule } from './mail/mail.module';
import { SmsModule } from './sms/sms.module';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { DialectModule } from './dialect/dialect.module';
import { LoggerModule } from 'nestjs-pino';
import { DappAddressModule } from './dapp-address/dapp-address.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: ['req.headers.authorization', 'res.headers'],
        autoLogging: {
          ignore: (msg) => {
            if (msg.statusCode && msg.statusCode >= 400) {
              return false;
            }
            return process.env.ENVIRONMENT !== 'local-development';
          },
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
    DappAddressModule,
    MailModule,
    SmsModule,
    TelegramModule,
    DialectModule,
  ],
  providers: [],
})
export class AppModule {}
