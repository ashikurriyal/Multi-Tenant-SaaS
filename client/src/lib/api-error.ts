import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { ApiErrorBody } from "@/types/api";

const isApiErrorBody = (data: unknown): data is ApiErrorBody =>
  typeof data === "object" && data !== null && "errorCode" in data && "message" in data;

// Turns an RTK Query error into LedgerFlow's error body, so forms can show
// `message` and map `errorDetails` onto their fields
export function getApiError(
  error: FetchBaseQueryError | SerializedError | undefined,
): ApiErrorBody | null {
  if (!error) return null;
  if ("status" in error) {
    if (isApiErrorBody(error.data)) return error.data;
    const network = error.status === "FETCH_ERROR";
    return {
      success: false,
      statusCode: typeof error.status === "number" ? error.status : 0,
      message: network ? "Can't reach the server. Check your connection." : "Something went wrong",
      errorCode: network ? "NETWORK_ERROR" : "UNKNOWN_ERROR",
      errorDetails: [],
    };
  }
  return {
    success: false,
    statusCode: 0,
    message: error.message ?? "Something went wrong",
    errorCode: "UNKNOWN_ERROR",
    errorDetails: [],
  };
}
