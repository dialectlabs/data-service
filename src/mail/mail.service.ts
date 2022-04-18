import { Injectable } from '@nestjs/common';
import sgMail from "@sendgrid/mail"

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey('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');
  }

  async sendVerificationCode(email: string, code: string ) {
    const mail = {
      to: email,
      subject: "Verfification code",
      from: 'hello@dialect.to',
      html: `<h1>${code}</h1`
    }
    try {
      const transport = await sgMail.send(mail);
      // avoid this on production. use log instead :)
      console.log(`E-Mail sent to ${transport}`);
    } catch(e: any) {
      console.log(e["response"].body);
    }
  }
}