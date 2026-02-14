import { apiClient } from "../api-client";

export interface PresignPayload {
  fileName: string;
  fileType: string;
}

export interface PresignResponse {
  uploadUrl: string;
  key: string;
  fields: Record<string, string>;
  fileUrl: string;
}

export const getPresignedUrl = (payload: PresignPayload) =>
  apiClient<PresignResponse>("/api/files/presign", {
    method: "POST",
    body: JSON.stringify(payload),
  });
