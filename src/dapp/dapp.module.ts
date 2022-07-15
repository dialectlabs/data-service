import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { DappService } from './dapp.service';
import { DappAddressesControllerV0 } from './dapp-addresses.controller.v0';
import { DappController } from './dapp.controller';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { TelegramModule } from '../telegram/telegram.module';
import { DappAddressModule } from '../dapp-address/dapp-address.module';
import { DappAddressesControllerV1 } from './dapp-addresses.controller.v1';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    SmsModule,
    TelegramModule,
    DappAddressModule,
  ],
  providers: [DappService],
  exports: [DappService],
  controllers: [
    DappAddressesControllerV0,
    DappController,
    DappAddressesControllerV1,
  ],
})
export class DappModule {}
