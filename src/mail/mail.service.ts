import { Injectable } from '@nestjs/common';
import sgMail from "@sendgrid/mail"

@Injectable()
export class MailService {
  constructor() {
    const key = String(process.env.SENDGRID_KEY);
    sgMail.setApiKey(key);
  }

  async sendVerificationCode(email: string, code: string ) {
    const mail = {
      to: email,
      subject: "Verfification code",
      from: String(process.env.SENDGRID_EMAIL),
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