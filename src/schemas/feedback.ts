import { z } from "zod";

export const feedbackSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  message: z.string().min(1, "Message is required").max(5000, "Message is too long"),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
