import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AddressService } from './address.service';
import { MailModule } from '../mail/mail.module';
import { SmsVerificationModule } from '../sms/sms.module';

@Module({
  imports: [PrismaModule, MailModule, SmsVerificationModule],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
