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
        body: `Hello from Dialect — Your verification code is ${verificationCode}.

If you didn't sign up for web3 notifications, you can ignore this text. Reply STOP to stop.`
      });
    } catch(e: any) {
      console.log(e["response"].body);
    }
  }
}