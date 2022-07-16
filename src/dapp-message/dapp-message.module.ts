import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { DappMessageService } from './dapp-message.service';
import { DappMessageController } from './dapp-message.controller';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { TelegramModule } from '../telegram/telegram.module';
import { DappAddressModule } from '../dapp-address/dapp-address.module';
import { DialectModule } from '../dialect/dialect.module';
import { DappModule } from '../dapp/dapp.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    SmsModule,
    TelegramModule,
    DappModule,
    DappAddressModule,
    DialectModule,
    NotificationModule,
  ],
  providers: [DappMessageService],
  exports: [],
  controllers: [DappMessageController],
})
export class DappMessageModule {}
