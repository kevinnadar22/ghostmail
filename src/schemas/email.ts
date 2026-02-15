import { z } from "zod";

export const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().min(1, "Email body is required"),
  files: z.array(z.string()).optional(),
  captchaToken: z.string().min(1, "Captcha token is required"),
  from: z.string().optional(),
});

export type EmailRequest = z.infer<typeof emailSchema>;
