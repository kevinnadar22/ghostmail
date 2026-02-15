import crypto from "crypto";

export interface FingerprintSignals {
    ip: string;
    userAgent: string;
    timezone: string;
    email?: string;
}


/**
 * Generates a unique fingerprint hash based on core identification signals.
 * 
 * @param signals - The signals used for fingerprinting (ip, userAgent, timezone)
 * @returns A SHA-256 hash of the fingerprint
 */
export const getRequestFingerprint = (signals: FingerprintSignals): string => {
    const { ip, userAgent, timezone } = signals;
    const fingerprintData = `${ip}${userAgent}${timezone}`;

    return crypto
        .createHash("sha256")
        .update(fingerprintData)
        .digest("hex");
};
