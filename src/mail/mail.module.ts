import { Module } from '@nestjs/common';
import { SendGridModule } from '@ntegral/nestjs-sendgrid';
import { MailService } from './mail.service';

@Module({
    imports: [
        SendGridModule.forRoot({
            apiKey: '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',
        }),
    ],
    providers: [MailService],
    exports: [MailService]
})

export class MailModule {}