import { config } from "@/config";

export interface CaptchaVerificationResponse {
    success: boolean;
    "error-codes"?: string[];
    challenge_ts?: string;
    hostname?: string;
}

export class CaptchaService {

    static async verify(token: string, remoteIp?: string): Promise<boolean> {
        try {
            if (!token) return false;

            const formData = new FormData();
            formData.append("secret", config.TURNSTILE_SECRET || "");
            formData.append("response", token);
            if (remoteIp) {
                formData.append("remoteip", remoteIp);
            }

            const response = await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                    method: "POST",
                    body: formData,
                }
            );

            const outcome: CaptchaVerificationResponse = await response.json();

            return outcome.success;
        } catch (error) {
            console.error("Captcha verification error:", error);
            return false;
        }
    }
}
