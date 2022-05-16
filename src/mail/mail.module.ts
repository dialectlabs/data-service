import { Module } from '@nestjs/common';
import { SendGridModule } from '@ntegral/nestjs-sendgrid';
import {
  MailVerificationService,
  NoopMailVerificationService,
  SendGridMailVerificationService,
} from './mail.service';

@Module({
  imports: [
    SendGridModule.forRoot({
      apiKey: String(process.env.SENDGRID_KEY),
    }),
  ],
  providers: [
    {
      provide: MailVerificationService,
      useClass:
        process.env.ENVIRONMENT === 'production' ||
        (process.env.SENDGRID_EMAIL && process.env.SENDGRID_KEY)
          ? SendGridMailVerificationService
          : NoopMailVerificationService,
    },
  ],
  exports: [MailVerificationService],
})
export class MailModule {}
