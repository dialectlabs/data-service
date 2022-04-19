import { Module } from '@nestjs/common';
import { SendGridModule } from '@ntegral/nestjs-sendgrid';
import { MailService } from './mail.service';

@Module({
    imports: [
        SendGridModule.forRoot({
            apiKey: String(process.env.SENDGRID_KEY),
        }),
    ],
    providers: [MailService],
    exports: [MailService]
})

export class MailModule {}