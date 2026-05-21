import {
  extractApiErrorMessage,
  isUnauthorizedStatus,
  notifyAuthExpired,
} from "@/api-actions/error-utils";
import { TokenStorage } from "@/utils/auth-api";
// TODO: Implement proper typing for shift data and responses

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TIMEOUT = 30000;

export class ShiftApiError extends Error {
  public isAuthError: boolean;

  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "ShiftApiError";
    this.isAuthError = isUnauthorizedStatus(statusCode);
  }
}

async function authorizedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await TokenStorage.getToken();

  const baseHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const customHeaders =
    options.headers &&
    typeof options.headers === "object" &&
    !(options.headers instanceof Headers)
      ? (options.headers as Record<string, string>)
      : {};
  if (token) baseHeaders["Authorization"] = `Bearer ${token}`;
  const headers: Record<string, string> = { ...baseHeaders, ...customHeaders };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new ShiftApiError("Request timeout. Please try again.");
    }
    console.error("Network error:", error);
    throw new ShiftApiError(
      error instanceof Error
        ? error.message
        : "Network error. Please check your internet connection.",
    );
  }
}

// Fetch all shifts
export async function fetchShifts(): Promise<any[]> {
  try {
    const response = await authorizedFetch(`${API_BASE_URL}/shifts`, {
      method: "GET",
    });
    let data: any;
    const responseText = await response.text();
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      if (!response.ok) {
        data = { message: responseText.trim() || "Invalid server response" };
      } else {
        throw new ShiftApiError(
          "Invalid server response (not JSON)",
          response.status,
        );
      }
    }
    if (!response.ok) {
      // Surface API error details if available
      const apiMessage = extractApiErrorMessage(data, "Failed to fetch shifts");
      if (isUnauthorizedStatus(response.status)) {
        await notifyAuthExpired({
          message: apiMessage,
          statusCode: response.status,
        });
      }
      throw new ShiftApiError(apiMessage, response.status);
    }
    if (!data || typeof data !== "object") {
      throw new ShiftApiError(
        "Malformed response from server",
        response.status,
      );
    }
    return data.data || [];
  } catch (error) {
    if (error instanceof ShiftApiError) throw error;
    console.error("fetchShifts error:", error);
    throw new ShiftApiError(
      error instanceof Error
        ? error.message
        : "An unexpected error occurred fetching shifts.",
    );
  }
}

// Fetch a single shift by ID
export async function fetchShiftById(shiftId: string): Promise<any> {
  try {
    const response = await authorizedFetch(
      `${API_BASE_URL}/shifts/${shiftId}`,
      {
        method: "GET",
      },
    );
    let data: any;
    const responseText = await response.text();
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      if (!response.ok) {
        data = { message: responseText.trim() || "Invalid server response" };
      } else {
        throw new ShiftApiError(
          "Invalid server response (not JSON)",
          response.status,
        );
      }
    }
    if (!response.ok) {
      const apiMessage = extractApiErrorMessage(data, "Failed to fetch shift");
      if (isUnauthorizedStatus(response.status)) {
        await notifyAuthExpired({
          message: apiMessage,
          statusCode: response.status,
        });
      }
      throw new ShiftApiError(apiMessage, response.status);
    }
    if (!data || typeof data !== "object") {
      throw new ShiftApiError(
        "Malformed response from server",
        response.status,
      );
    }
    return data.data;
  } catch (error) {
    if (error instanceof ShiftApiError) throw error;
    console.error("fetchShiftById error:", error);
    throw new ShiftApiError(
      error instanceof Error
        ? error.message
        : "An unexpected error occurred fetching the shift.",
    );
  }
}

export async function fetchDashboard(): Promise<any> {
  try {
    const response = await authorizedFetch(`${API_BASE_URL}/hcp/dashboard`, {
      method: "GET",
    });
    let data: any;
    const responseText = await response.text();
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      if (!response.ok) {
        data = { message: responseText.trim() || "Invalid server response" };
      } else {
        throw new ShiftApiError(
          "Invalid server response (not JSON)",
          response.status,
        );
      }
    }
    if (!response.ok) {
      const apiMessage = extractApiErrorMessage(
        data,
        "Failed to fetch dashboard data",
      );
      if (isUnauthorizedStatus(response.status)) {
        await notifyAuthExpired({
          message: apiMessage,
          statusCode: response.status,
        });
      }
      throw new ShiftApiError(apiMessage, response.status);
    }
    if (!data || typeof data !== "object") {
      throw new ShiftApiError(
        "Malformed response from server",
        response.status,
      );
    }
    return data;
  } catch (error) {
    if (error instanceof ShiftApiError) throw error;
    console.error("fetchDashboard error:", error);
    throw new ShiftApiError(
      error instanceof Error
        ? error.message
        : "An unexpected error occurred fetching dashboard.",
    );
  }
}
