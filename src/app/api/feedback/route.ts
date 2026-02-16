import { NextRequest, NextResponse } from "next/server";
import { feedbackSchema } from "@/schemas";
import * as ApiResponse from "@/helpers/api-response";
import { parseZodError } from "@/helpers/api-errors";
import { getClientIP } from "@/helpers/request";
import connectToDB from "@/lib/db";
import FeedbackModel from "@/model/Feedback";

export async function POST(req: NextRequest) {
  try {
    // 1. Identify Identification Signals
    const ip = getClientIP(req);

    // 2. Parse and Validate Body
    const json = await req.json();
    const result = feedbackSchema.safeParse(json);

    if (!result.success) {
      return ApiResponse.BadRequest(parseZodError(result.error));
    }

    const { email, message } = result.data;

    // 3. Connect to DB and Save Feedback
    await connectToDB();

    const newFeedback = new FeedbackModel({
      ipAddress: ip,
      email: email || undefined,
      message,
    });

    await newFeedback.save();

    return ApiResponse.Message("Feedback submitted successfully", {
      id: newFeedback._id,
    });
  } catch (error) {
    console.error("Feedback API Error:", error);
    return ApiResponse.InternalServerError();
  }
}
