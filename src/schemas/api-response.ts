import { z } from "zod";

/**
 * Base API Response Schema
 * All API endpoints should return data in this format
 */
export const APIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: z.string().optional(),
        message: z.string().optional(),
    });

export type APIResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
};
