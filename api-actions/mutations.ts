import { TokenStorage } from "@/utils/auth-api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://admin.ishapps.com/shapp-dev/api";
const API_TIMEOUT = 30000;

export class ApiMutationError extends Error {
  public statusCode?: number;
  public details?: unknown;
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = "ApiMutationError";
    this.statusCode = statusCode;
    this.details = details;
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
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      throw new ApiMutationError(
        "Invalid server response (not JSON)",
        response.status,
      );
    }
    if (!response.ok) {
      console.error("API error response:", {
        status: response.status,
        body: data,
      });
      const apiMessage =
        isObject(data) &&
        (typeof data.message === "string" ? data.message : data.error)
          ? (data as { message?: string; error?: string }).message ||
            (data as { error?: string }).error
          : `Failed to ${method === "POST" ? "create" : "update"}`;
      throw new ApiMutationError(
        apiMessage || "API error",
        response.status,
        data,
      );
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

    console.log("API response:", data);
    // return (
    //   "data" in data && data.data !== undefined ? data.data : data
    // ) as Res;
    return data as Res;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiMutationError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiMutationError("Request timeout. Please try again.");
    }
    throw new ApiMutationError(
      error instanceof Error
        ? error.message
        : "Network error. Please check your internet connection.",
    );
  }
}

// POST: Create resource
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

// PUT: Update resource
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

// Example usage for TanStack Query:
// const mutation = useMutation((payload: ShiftCreatePayload) => postResource<ShiftCreatePayload, ShiftResponse>("/shifts", payload, isShiftResponse));
// const updateMutation = useMutation((payload: ShiftUpdatePayload) => putResource<ShiftUpdatePayload, ShiftResponse>(`/shifts/${id}`, payload, isShiftResponse));
