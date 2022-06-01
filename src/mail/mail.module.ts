import { Module } from '@nestjs/common';
import { SendGridModule } from '@ntegral/nestjs-sendgrid';
import {
  MailService,
  NoopMailService,
  SendGridMailService,
} from './mail.service';

@Module({
  imports: [
    SendGridModule.forRoot({
      apiKey: String(process.env.SENDGRID_KEY),
    }),
  ],
  providers: [
    {
      provide: MailService,
      useClass:
        process.env.ENVIRONMENT === 'production' ||
        (process.env.SENDGRID_EMAIL && process.env.SENDGRID_KEY)
          ? SendGridMailService
          : NoopMailService,
    },
  ],
  exports: [MailService],
})
export class MailModule {}
