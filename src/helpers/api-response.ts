import { NextResponse } from "next/server";
import { APIResponse } from "@/schemas/api-response";


export const Ok = <T>(data: T, status = 200) => {
  const response: APIResponse<T> = {
    success: true,
    data,
  };
  return NextResponse.json(response, { status });
};


export const Message = <T>(message: string, data?: T, status = 200) => {
  const response: APIResponse<T> = {
    success: true,
    message,
    data,
  };
  return NextResponse.json(response, { status });
};


export const ErrorResponse = (error: string, status = 400) => {
  const response: APIResponse<null> = {
    success: false,
    error,
  };
  return NextResponse.json(response, { status });
};


// make a wrapper around error response for common errors, like badrequest, internal server error
export const BadRequest = (error = "Bad Request") => ErrorResponse(error, 400);
export const Unauthorized = (error = "Unauthorized") => ErrorResponse(error, 401);
export const Forbidden = (error = "Forbidden") => ErrorResponse(error, 403);
export const NotFound = (error = "Not Found") => ErrorResponse(error, 404);
export const TooManyRequests = (error = "Too Many Requests") => ErrorResponse(error, 429);
export const InternalServerError = (error = "Internal Server Error") => ErrorResponse(error, 500);