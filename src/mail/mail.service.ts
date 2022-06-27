import { Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

export abstract class MailService {
  abstract sendVerificationCode(
    recipientSmsNumber: string,
    verificationCode: string,
  ): Promise<any>;

  abstract send(to: string, subject: string, html: string): Promise<void>;
}

export class NoopMailService extends MailService {
  private readonly logger = new Logger(NoopMailService.name);

  constructor() {
    super();
    this.logger.warn(
      `Using ${NoopMailService.name} to send verification codes: no real mail messages will be sent`,
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

  async send(to: string, subject: string, html: string): Promise<void> {
    this.logger.log(`Sending email ${html} from ${subject} to ${to}`);
  }
}

export class SendGridMailService extends MailService {
  private readonly logger = new Logger(SendGridMailService.name);

  constructor() {
    super();
    const key = String(process.env.SENDGRID_KEY);
    sgMail.setApiKey(key);
  }

  async send(to: string, subject: string, html: string) {
    const mail = {
      to,
      subject,
      from: String(process.env.SENDGRID_EMAIL),
      html,
    };

    try {
      const transport = await sgMail.send(mail);
      // avoid this on production. use log instead :)
      this.logger.log(`Email sent to ${transport}`);
    } catch (e: any) {
      this.logger.error('Error sending SendGrid mail:', e['response'].body);
    }
  }

  async sendVerificationCode(email: string, code: string) {
    const subject = 'Hello from Dialect — Verify your email address';
    const html = `Welcome to Dialect. Please confirm your email address using the code provided below:
<h1>${code}</h1>
If you didn't sign up for web3 notifications using Dialect, you can ignore this email.`;

    return await this.send(email, subject, html);
  }
}
