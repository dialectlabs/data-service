import { Module } from '@nestjs/common';
import {
  NoopSmsVerificationService,
  SmsVerificationService,
  TwilioSmsVerificationService,
} from './sms.service';

@Module({
  imports: [],
  providers: [
    {
      provide: SmsVerificationService,
      useClass:
        process.env.ENVIRONMENT === 'production' ||
        (process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_SMS_SENDER)
          ? TwilioSmsVerificationService
          : NoopSmsVerificationService,
    },
  ],
  exports: [SmsVerificationService],
})
export class SmsVerificationModule {}
