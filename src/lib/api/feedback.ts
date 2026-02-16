import { apiClient } from "../api-client";
import { FeedbackInput } from "@/schemas/feedback";

export const sendFeedback = (payload: FeedbackInput) =>
  apiClient("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
