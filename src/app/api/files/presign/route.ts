import { NextRequest } from "next/server";
import { PresignRequestSchema } from "@/schemas";
import { parseZodError } from "@/helpers/api-errors";
import { FileService } from "@/service/file-service";
import { RatelimitService } from "@/service/ratelimit-service";
import { Ok, BadRequest, InternalServerError, TooManyRequests } from "@/helpers/api-response";

export async function POST(req: NextRequest) {
  try {
    // 1. Identify Identification Signals for Rate Limiting
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const timezone = req.headers.get("x-timezone") || "unknown";

    const body = await req.json();

    // 2. Validate request body
    const validation = PresignRequestSchema.safeParse(body);
    if (!validation.success) {
      return BadRequest(parseZodError(validation.error));
    }

    const { fileName, fileType } = validation.data;

    // 3. Apply Rate Limiting
    const { success } = await RatelimitService.checkPresign({
      ip,
      userAgent,
      timezone
    });

    if (!success) {
      return TooManyRequests("Too many requests. Please try again later.");
    }

    // 4. Delegate logic to Service
    const data = await FileService.generatePresignedUrl(fileName, fileType);

    // 5. Return consistent response
    return Ok(data);
  } catch (error) {
    console.error("Presign URL error:", error);
    return InternalServerError("Failed to generate presigned URL");
  }
}
