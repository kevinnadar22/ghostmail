import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { s3 } from "@/lib/s3";
import { config } from "@/config";

export interface PresignedUrlResponse {
  fileUrl: string;
  uploadUrl: string;
  key: string;
  fields: Record<string, string>;
}

export interface FileAttachment {
  filename?: string;
  content: Buffer;
}

export class FileService {
  /**
   * Generates a presigned URL for S3 upload.
   * 
   * @param fileName - Original name of the file
   * @param fileType - MIME type of the file
   * @returns Metadata for the upload and the final file location
   */
  static async generatePresignedUrl(
    fileName: string,
    fileType: string
  ): Promise<PresignedUrlResponse> {
    const expiration = 3600; // 1 hour
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    // Sanitize fileName to prevent path traversal or weird characters
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/^\.+/g, "");
    
    // Generate a unique key for the file to prevent collisions
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const objectKey = `uploads/${uniqueId}-${sanitizedFileName}`;

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: config.S3_BUCKET!,
      Key: objectKey,
      Conditions: [
        ["content-length-range", 0, maxFileSize],
        ["eq", "$Content-Type", fileType],
      ],
      Fields: {
        "Content-Type": fileType,
      },
      Expires: expiration,
    });

    // Construct the final file URL (where it will be accessible after upload)
    const fileUrl = `https://${config.S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${objectKey}`;

    return {
      fileUrl,
      uploadUrl: url,
      key: objectKey,
      fields,
    };
  }

  /**
   * Fetches multiple files from S3 and formats them as email attachments.
   * 
   * @param keys - Array of S3 keys
   * @returns Array of file attachments
   */
  static async getFilesAsAttachments(keys: string[]): Promise<FileAttachment[]> {
    const attachments: FileAttachment[] = [];

    for (const key of keys) {
      // SECURITY: Ensure keys only point to the uploads directory
      if (!key.startsWith("uploads/")) {
        console.warn(`Blocked attempt to access invalid S3 key: ${key}`);
        continue;
      }

      try {
        const file = await s3.send(new GetObjectCommand({
          Bucket: config.S3_BUCKET,
          Key: key
        }));

        if (file.Body) {
          const buffer = Buffer.from(await file.Body.transformToByteArray());
          attachments.push({
            filename: key.split("/").pop(),
            content: buffer
          });
        }
      } catch (error) {
        console.error(`Error fetching file ${key}:`, error);
        // We continue with other files even if one fails
      }
    }

    return attachments;
  }
}
