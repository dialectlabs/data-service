import { Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

export abstract class MailVerificationService {
  abstract sendVerificationCode(
    recipientSmsNumber: string,
    verificationCode: string,
  ): Promise<any>;
}

export class NoopMailVerificationService extends MailVerificationService {
  private readonly logger = new Logger(NoopMailVerificationService.name);

  constructor() {
    super();
    this.logger.warn(
      `Using ${NoopMailVerificationService.name} to send verification codes: no real mail messages will be sent`,
    );
  }

  async sendVerificationCode(
    email: string,
    verificationCode: string,
  ): Promise<any> {
    this.logger.log(
      `Sending verification code ${verificationCode} to ${email}`,
    );
  }
}

export class SendGridMailVerificationService extends MailVerificationService {
  private readonly logger = new Logger(SendGridMailVerificationService.name);

  constructor() {
    super();
    const key = String(process.env.SENDGRID_KEY);
    sgMail.setApiKey(key);
  }

  async sendVerificationCode(email: string, verificationCode: string) {
    const mail = {
      to: email,
      subject: 'Hello from Dialect — Verify your email address',
      from: String(process.env.SENDGRID_EMAIL),
      html: `Welcome to Dialect. Please confirm your email address using the code provided below:
      <h1>${verificationCode}</h1>
      If you didn't sign up for web3 notifications using Dialect, you can ignore this email.`,
    };

    try {
      const transport = await sgMail.send(mail);
      // avoid this on production. use log instead :)
      this.logger.log(`E-Mail sent to ${transport}`);
    } catch (e: any) {
      this.logger.error(e['response'].body);
    }
  }
}
