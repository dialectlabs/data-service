import { Module } from '@nestjs/common';
import { SmsVerificationService } from './sms.service';

@Module({
  imports: [],
  providers: [SmsVerificationService],
  exports: [SmsVerificationService],
})
export class SmsVerificationModule {}
