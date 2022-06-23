import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AddressService } from './address.service';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [PrismaModule, MailModule, SmsModule],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
