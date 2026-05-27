import { apiRequest, ApiRequestError } from "@/api-actions/api-client";
import {
  extractApiErrorMessage,
  isUnauthorizedStatus,
  notifyAuthExpired,
} from "@/api-actions/error-utils";
import { TokenStorage } from "@/utils/auth-api";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TIMEOUT = 30000;

export class ApiMutationError extends Error {
  public statusCode?: number;
  public details?: unknown;
  public isAuthError: boolean;
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = "ApiMutationError";
    this.statusCode = statusCode;
    this.details = details;
    this.isAuthError = isUnauthorizedStatus(statusCode);
  }
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

async function authorizedMutation<Req, Res>(
  url: string,
  endpoint: string,
  method: "POST" | "PUT",
  body: Req,
  customHeaders: Record<string, string> = {},
  validateResponse?: (data: unknown) => data is Res,
): Promise<Res> {
  const token = await TokenStorage.getToken();
  const headers: Record<string, unknown> = { ...customHeaders };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const { data, response } = await apiRequest<unknown>({
      url,
      method,
      headers,
      body,
      endpoint,
      timeoutMs: API_TIMEOUT,
      retryOnAndroidNetworkError: true,
    });

    if (!isObject(data)) {
      throw new ApiMutationError(
        "Malformed response from server",
        response.status,
      );
    }
    if (validateResponse && !validateResponse(data)) {
      throw new ApiMutationError(
        "Response validation failed",
        response.status,
        data,
      );
    }

    // console.log("API response:", data);
    // return (
    //   "data" in data && data.data !== undefined ? data.data : data
    // ) as Res;
    return data as Res;
  } catch (error) {
    if (error instanceof ApiMutationError) throw error;

    if (error instanceof ApiRequestError) {
      const data = error.details.data;
      const statusCode = error.details.statusCode;

      if (error.kind === "server") {
        const finalMessage =
          extractApiErrorMessage(
            data,
            `Failed to ${method === "POST" ? "create" : "update"}`,
          ) || "API error";

        if (isUnauthorizedStatus(statusCode)) {
          await notifyAuthExpired({
            message: finalMessage,
            statusCode: statusCode ?? 0,
          });
        }

        throw new ApiMutationError(finalMessage, statusCode, data);
      }

      throw new ApiMutationError(error.details.userMessage);
    }

    throw new ApiMutationError(
      error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please try again.",
    );
  }
}

export async function postResource<Req, Res>(
  endpoint: string,
  payload: Req,
  validateResponse?: (data: unknown) => data is Res,
): Promise<Res> {
  return authorizedMutation<Req, Res>(
    `${API_BASE_URL}${endpoint}`,
    endpoint,
    "POST",
    payload,
    {},
    validateResponse,
  );
}

export async function putResource<Req, Res>(
  endpoint: string,
  payload: Req,
  validateResponse?: (data: unknown) => data is Res,
): Promise<Res> {
  return authorizedMutation<Req, Res>(
    `${API_BASE_URL}${endpoint}`,
    endpoint,
    "PUT",
    payload,
    {},
    validateResponse,
  );
}
