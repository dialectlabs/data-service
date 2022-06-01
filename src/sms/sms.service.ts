import { Logger } from '@nestjs/common';
import { Twilio } from 'twilio';

export abstract class SmsService {
  abstract sendVerificationCode(
    recipientSmsNumber: string,
    verificationCode: string,
  ): Promise<any>;

  abstract send(to: string, body: string): Promise<void>;
}

export class NoopSmsService extends SmsService {
  private readonly logger = new Logger(NoopSmsService.name);

  constructor() {
    super();
    this.logger.warn(
      `Using ${NoopSmsService.name} to send verification codes: no real sms messages will be sent`,
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

  send(to: string, body: string): Promise<void> {
    this.logger.log(`Sending ${body} to ${to}`);
    return Promise.resolve();
  }
}

export class TwilioSmsService extends SmsService {
  private twilio: Twilio;

  private readonly logger = new Logger(NoopSmsService.name);

  constructor() {
    super();
    this.twilio = new Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );
  }

  async send(to: string, body: string) {
    try {
      await this.twilio.messages.create({
        to,
        from: process.env.TWILIO_SMS_SENDER!,
        body,
      });
    } catch (e: any) {
      this.logger.error('Error sending Twilio message:', e['response'].body);
    }
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
