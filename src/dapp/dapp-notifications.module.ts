import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { DappNotificationsService } from './dapp-notifications.service';
import { DappNotificationsController } from './dapp-notifications.controller';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { TelegramModule } from '../telegram/telegram.module';
import { DappAddressModule } from '../dapp-address/dapp-address.module';
import { DialectModule } from '../dialect/dialect.module';
import { DappModule } from '../dapp-catalog/dapp.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    SmsModule,
    TelegramModule,
    DappModule,
    DappAddressModule,
    DialectModule,
  ],
  providers: [DappNotificationsService],
  exports: [],
  controllers: [DappNotificationsController],
})
export class DappNotificationsModule {}
