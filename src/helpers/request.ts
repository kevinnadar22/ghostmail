import { NextRequest } from "next/server";

/**
 * Extracts the client IP address from the request headers.
 */
export const getClientIP = (req: NextRequest): string => {
    return req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";
};
