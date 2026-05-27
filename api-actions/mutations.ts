import {
  captureApiNetworkErrorToSentry,
  extractApiErrorMessage,
  isFetchNetworkError,
  isRequestTimeoutError,
  isUnauthorizedStatus,
  logApiErrorToSentry,
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
  method: "POST" | "PUT",
  body: Req,
  customHeaders: Record<string, string> = {},
  validateResponse?: (data: unknown) => data is Res,
): Promise<Res> {
  const token = await TokenStorage.getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...customHeaders,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    let data: unknown;
    const responseText = await response.text();
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      if (!response.ok) {
        data = { message: responseText.trim() || "Invalid server response" };
      } else {
        throw new ApiMutationError(
          "Invalid server response (not JSON)",
          response.status,
        );
      }
    }
    if (!response.ok) {
      console.error("API error response:", {
        status: response.status,
        body: data,
      });

      const finalMessage =
        extractApiErrorMessage(
          data,
          `Failed to ${method === "POST" ? "create" : "update"}`,
        ) || "API error";
      console.error("API error finalMessage:", finalMessage);
      if (isUnauthorizedStatus(response.status)) {
        await notifyAuthExpired({
          message: finalMessage,
          statusCode: response.status,
        });
      }
      throw new ApiMutationError(finalMessage, response.status, data);
    }
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
    clearTimeout(timeoutId);

    if (error instanceof ApiMutationError) throw error;

    if (isRequestTimeoutError(error)) {
      captureApiNetworkErrorToSentry(error, {
        endpoint: url,
        baseURL: API_BASE_URL,
        hasBaseURL: Boolean(API_BASE_URL),
        method,
        reason: "timeout",
        timeoutMs: API_TIMEOUT,
      });
      throw new ApiMutationError("Request timeout. Please try again.");
    }

    if (isFetchNetworkError(error)) {
      captureApiNetworkErrorToSentry(error, {
        endpoint: url,
        baseURL: API_BASE_URL,
        hasBaseURL: Boolean(API_BASE_URL),
        method,
        reason: "fetch_network_error",
        timeoutMs: API_TIMEOUT,
      });
      throw new ApiMutationError(
        "Network error. Please check your internet connection.",
      );
    }

    logApiErrorToSentry(error, {
      endpoint: url,
      method,
    });

    throw new ApiMutationError(
      error instanceof Error
        ? error.message
        : "Network error. Please check your internet connection.",
    );
  }
}

export async function postResource<Req, Res>(
  endpoint: string,
  payload: Req,
  validateResponse?: (data: unknown) => data is Res,
): Promise<Res> {
  console.log("POST", `${API_BASE_URL}${endpoint}`, payload);
  return authorizedMutation<Req, Res>(
    `${API_BASE_URL}${endpoint}`,
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
    "PUT",
    payload,
    {},
    validateResponse,
  );
}
