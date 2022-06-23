import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { DappService } from './dapp.service';
import { DappControllerV0 } from './dapp.controller.v0';
import { DappControllerV1 } from './dapp.controller.v1';
import { DappNotificationsService } from './dapp-notifications.service';
import { DappNotificationsController } from './dapp-notifications.controller';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { TelegramModule } from '../telegram/telegram.module';
import { DappAddressModule } from '../dapp-address/dapp-address.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    SmsModule,
    TelegramModule,
    DappAddressModule,
  ],
  providers: [DappService, DappNotificationsService, DappControllerV1],
  exports: [DappService],
  controllers: [
    DappControllerV0,
    DappControllerV1,
    DappNotificationsController,
  ],
})
export class DappModule {}
