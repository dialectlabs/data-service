import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { DappMessageModule } from './dapp-message/dapp-message.module';
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
        serializers: {
          req(req) {
            req.body = req.raw.body;
            return req;
          },
        },
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
    DappMessageModule,
    DappAddressModule,
    MailModule,
    SmsModule,
    TelegramModule,
    DialectModule,
  ],
  providers: [],
})
export class AppModule {}
