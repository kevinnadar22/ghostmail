import { z } from "zod";

export const PresignRequestSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
});

export type PresignRequest = z.infer<typeof PresignRequestSchema>;
