import { minuteRateLimit, dailyRateLimit, presignRateLimit } from "@/lib/ratelimit";
import { getRequestFingerprint, FingerprintSignals } from "@/helpers/fingerprint";
import { config } from "@/config";

export class RatelimitService {
  /**
   * Checks if a request should be rate limited based on identification signals.
   * 
   * @param signals - The identification signals (ip, userAgent, timezone, email)
   * @returns An object containing success boolean and the limit info
   */
  static async check(signals: FingerprintSignals) {
    // 0. Skip rate limit for exempted emails
    if (signals.email && config.EXCLUDE_RATELIMIT_EMAILS.includes(signals.email)) {
      return { success: true, limit: 0, remaining: 0, reset: 0, pending: Promise.resolve() };
    }

    // 1. Generate fingerprint using the pure helper
    const identifier = getRequestFingerprint(signals);
    
    // 2. Check both rate limits
    const [minRes, dayRes] = await Promise.all([
      minuteRateLimit.limit(identifier),
      dailyRateLimit.limit(identifier)
    ]);

    // 3. Return failure if either limit is hit
    if (!minRes.success) return minRes;
    if (!dayRes.success) return dayRes;

    return minRes;
  }

  /**
   * Checks if a presign request should be rate limited.
   * Limit: 100/day per IP/UserAgent combination
   */
  static async checkPresign(signals: FingerprintSignals) {
    // 1. Generate fingerprint
    const identifier = getRequestFingerprint(signals);

    // 2. Check the presign-specific rate limit
    return await presignRateLimit.limit(identifier);
  }
}

