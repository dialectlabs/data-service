import { Module } from '@nestjs/common';
import { NoopSmsService, SmsService, TwilioSmsService } from './sms.service';

@Module({
  imports: [],
  providers: [
    {
      provide: SmsService,
      useClass:
        process.env.ENVIRONMENT === 'production' ||
        (process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_SMS_SENDER)
          ? TwilioSmsService
          : NoopSmsService,
    },
  ],
  exports: [SmsService],
})
export class SmsModule {}
