import { Logger } from '@nestjs/common';
import { Twilio } from 'twilio';

export abstract class SmsVerificationService {
  abstract sendVerificationCode(
    recipientSmsNumber: string,
    verificationCode: string,
  ): Promise<any>;
}

export class NoopSmsVerificationService extends SmsVerificationService {
  private readonly logger = new Logger(NoopSmsVerificationService.name);

  constructor() {
    super();
    this.logger.warn(
      `Using ${NoopSmsVerificationService.name} to send verification codes: no real sms messages will be sent`,
    );
  }

  async sendVerificationCode(
    recipientSmsNumber: string,
    verificationCode: string,
  ): Promise<any> {
    this.logger.log(
      `Sending verification code ${verificationCode} to ${recipientSmsNumber}`,
    );
  }
}

export class TwilioSmsVerificationService extends SmsVerificationService {
  private twilio: Twilio;

  private readonly logger = new Logger(NoopSmsVerificationService.name);

  constructor() {
    super();
    this.twilio = new Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );
  }

  async sendVerificationCode(
    recipientSmsNumber: string,
    verificationCode: string,
  ) {
    try {
      this.twilio.messages.create({
        to: recipientSmsNumber,
        from: process.env.TWILIO_SMS_SENDER!,
        body: `Hello from Dialect — Your verification code is ${verificationCode}.
If you didn't sign up for web3 notifications, you can ignore this text. Reply STOP to stop.`,
      });
    } catch (e: any) {
      this.logger.error(e['response'].body);
    }
  }
}
