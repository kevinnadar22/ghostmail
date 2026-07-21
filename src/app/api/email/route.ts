import { NextRequest } from "next/server";
import { FileService } from "@/service/file-service";
import { MailService } from "@/service/mail";
import { emailSchema } from "@/schemas";
import * as ApiResponse from "@/helpers/api-response";
import { parseZodError } from "@/helpers/api-errors";

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const result = emailSchema.safeParse(json);

        if (!result.success) {
            return ApiResponse.BadRequest(parseZodError(result.error));
        }

        const { to, subject, html, files, fromName } = result.data;

        const attachments = files && Array.isArray(files)
            ? await FileService.getFilesAsAttachments(files)
            : [];

        const emailResult = await MailService.sendEmail({
            to,
            subject,
            html,
            fromName,
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
