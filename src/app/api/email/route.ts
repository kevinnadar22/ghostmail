import { NextRequest } from "next/server";
import { RatelimitService } from "@/service/ratelimit-service";
import { CaptchaService } from "@/service/captcha";
import { FileService } from "@/service/file-service";
import { MailService } from "@/service/mail";
import { emailSchema } from "@/schemas";
import * as ApiResponse from "@/helpers/api-response";
import { parseZodError } from "@/helpers/api-errors";

export async function POST(req: NextRequest) {
    try {
        // 1. Identify Identification Signals (used for rate limiting and fingerprinting)
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";
        const userAgent = req.headers.get("user-agent") || "unknown";
        const timezone = req.headers.get("x-timezone") || "unknown";

        // 2. Apply Rate Limiting via RatelimitService (Pure Params)
        const { success } = await RatelimitService.check({
            ip,
            userAgent,
            timezone
        });
        
        if (!success) {
            return ApiResponse.TooManyRequests("Too many requests. Please try again later.");
        }

        // 3. Parse and Validate Body
        const json = await req.json();
        const result = emailSchema.safeParse(json);

        if (!result.success) {
            return ApiResponse.BadRequest(parseZodError(result.error));
        }

        const { to, subject, html, files, captchaToken, from } = result.data;

        // 4. Captcha Verification
        const isCaptchaValid = await CaptchaService.verify(captchaToken, ip);
        if (!isCaptchaValid) {
            return ApiResponse.Forbidden("Captcha verification failed.");
        }

        // 5. Fetch Attachments via FileService
        const attachments = files && Array.isArray(files)
            ? await FileService.getFilesAsAttachments(files)
            : [];

        // 6. Send Email via MailService
        const emailResult = await MailService.sendEmail({
            to,
            subject,
            html,
            from,
            attachments,
        });

        if (emailResult.error) {
            console.error("Email sending error:", emailResult.error);
            return ApiResponse.InternalServerError("Failed to send email.");
        }

        return ApiResponse.Message("Email sent successfully", {
            id: emailResult.data?.id
        });

    } catch (error) {
        console.error("API Error:", error);
        return ApiResponse.InternalServerError();
    }
}
