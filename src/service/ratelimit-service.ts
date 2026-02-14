import { ratelimit } from "@/lib/ratelimit";
import { getRequestFingerprint, FingerprintSignals } from "@/helpers/fingerprint";

export class RatelimitService {
  /**
   * Checks if a request should be rate limited based on identification signals.
   * 
   * @param signals - The identification signals (ip, userAgent, timezone)
   * @returns An object containing success boolean and the limit info
   */
  static async check(signals: FingerprintSignals) {
    // 1. Generate fingerprint using the pure helper
    const identifier = getRequestFingerprint(signals);
    
    // 2. Check rate limit using the fingerprint as the key
    return await ratelimit.limit(identifier);
  }
}
