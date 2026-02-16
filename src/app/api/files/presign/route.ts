import { NextRequest } from "next/server";
import { PresignRequestSchema } from "@/schemas";
import { parseZodError } from "@/helpers/api-errors";
import { FileService } from "@/service/file-service";
import { RatelimitService } from "@/service/ratelimit-service";
import { Ok, BadRequest, InternalServerError, TooManyRequests } from "@/helpers/api-response";
import { getClientInfo } from "@/helpers/request";

export async function POST(req: NextRequest) {
  try {
    // 1. Identify Identification Signals for Rate Limiting
    const { ip, userAgent, timezone } = getClientInfo(req);

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
