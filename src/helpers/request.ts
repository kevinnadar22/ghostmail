import { NextRequest } from "next/server";

/**
 * Extracts client identification signals from the request headers.
 */
export const getClientInfo = (req: NextRequest) => {
    const ip = req.headers.get("cf-connecting-ip") ?? 
               req.headers.get("x-forwarded-for")?.split(",")[0] ?? 
               "127.0.0.1";
               
    const userAgent = req.headers.get("user-agent") || "unknown";
    const timezone = req.headers.get("x-timezone") || "unknown";

    return { ip, userAgent, timezone };
};

/**
 * Extracts just the client IP address from the request headers.
 */
export const getClientIP = (req: NextRequest): string => {
    return req.headers.get("cf-connecting-ip") ?? 
           req.headers.get("x-forwarded-for")?.split(",")[0] ?? 
           "127.0.0.1";
};
