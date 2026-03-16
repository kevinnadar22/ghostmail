import { resend } from "@/lib/resend";
import { FileAttachment } from "./file-service";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  fromName?: string;
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
    const { to, subject, html, fromName, attachments } = params;
    let fromEmail = "";
    if (fromName) {
      fromEmail = fromName + " <ghostmail@mariakevin.in>";
    }
    else {
      fromEmail = "GhostMail <ghostmail@mariakevin.in>";
    }

    return await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      attachments,
    });
  }
}
