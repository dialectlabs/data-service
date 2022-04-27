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
      subject: "Hello from Dialect — Verify your email address",
      from: String(process.env.SENDGRID_EMAIL),
      html: `Welcome to Dialect. Please confirm your email address using the code provided below:
      
<h1>${code}</h1>

If you didn't sign up for web3 notifications using Dialect, you can ignore this email.`
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