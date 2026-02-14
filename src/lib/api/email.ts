import { apiClient } from "../api-client";

export interface SendEmailPayload {
  to: string;
  fromName?: string;
  subject: string;
  html: string;
  files?: string[];
  captchaToken: string;
}

export interface SendEmailResponse {
  id: string;
}

export const sendEmail = (payload: SendEmailPayload) =>
  apiClient<SendEmailResponse>("/api/email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
