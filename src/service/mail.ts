import { resend } from "@/lib/resend";
import { FileAttachment } from "./file-service";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  attachments?: FileAttachment[];
}

export class MailService {
  /**
   * Sends an email using the Resend service.
   *
   * @param params - Email parameters (to, subject, html, attachments, etc.)
   * @returns The result from Resend API
   */
  static async sendEmail(params: SendEmailParams) {
    const { to, subject, html, from, attachments } = params;

    return await resend.emails.send({
      from: from || ""+ "<anonymous@mariakevin.in>",
      to,
      subject,
      html,
      attachments,
    });
  }
}
