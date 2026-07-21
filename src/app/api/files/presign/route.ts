import { NextRequest } from "next/server";
import { PresignRequestSchema } from "@/schemas";
import { parseZodError } from "@/helpers/api-errors";
import { FileService } from "@/service/file-service";
import { Ok, BadRequest, InternalServerError } from "@/helpers/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = PresignRequestSchema.safeParse(body);
    if (!validation.success) {
      return BadRequest(parseZodError(validation.error));
    }

    const { fileName, fileType } = validation.data;
    const data = await FileService.generatePresignedUrl(fileName, fileType);

    return Ok(data);
  } catch (error) {
    console.error("Presign URL error:", error);
    return InternalServerError("Failed to generate presigned URL");
  }
}
