import { z } from "zod";

export const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().min(1, "Email body is required"),
  files: z.array(z.string()).optional(),
  fromName: z.string().optional(),
});

export const emailFormSchema = z.object({
  to: z.string().email("Invalid email address").min(1, "Recipient is required"),
  fromName: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
});


export type EmailRequest = z.infer<typeof emailSchema>;
export type EmailFormValues = z.infer<typeof emailFormSchema>;

