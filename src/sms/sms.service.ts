import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class SmsVerificationService {
  private twilio: Twilio;
  constructor() {
    this.twilio = new Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  }

  async sendVerificationCode(recipientSmsNumber: string, verificationCode: string ) {
    try {
      this.twilio.messages.create({
        to: recipientSmsNumber,
        from: process.env.TWILIO_SMS_SENDER!,
        body: `Dialect verification code: ${verificationCode}`
      });
    } catch(e: any) {
      console.log(e["response"].body);
    }
  }
}