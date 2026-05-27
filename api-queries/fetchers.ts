import { apiRequest, ApiRequestError } from "@/api-actions/api-client";
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

async function authorizedJson(url: string, endpoint: string): Promise<unknown> {
  const token = await TokenStorage.getToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const { data } = await apiRequest<unknown>({
      url,
      endpoint,
      headers,
      method: "GET",
      timeoutMs: API_TIMEOUT,
      retryOnAndroidNetworkError: true,
    });

    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.kind === "server") {
        const apiMessage = extractApiErrorMessage(
          error.details.data,
          "Request failed",
        );
        if (isUnauthorizedStatus(error.details.statusCode)) {
          await notifyAuthExpired({
            message: apiMessage,
            statusCode: error.details.statusCode ?? 0,
          });
        }
        throw new ShiftApiError(apiMessage, error.details.statusCode);
      }

      throw new ShiftApiError(error.details.userMessage);
    }

    throw new ShiftApiError(
      error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please try again.",
    );
  }
}

// Fetch all shifts
export async function fetchShifts(): Promise<any[]> {
  try {
    const data = await authorizedJson(`${API_BASE_URL}/shifts`, "/shifts");
    if (!data || typeof data !== "object") {
      throw new ShiftApiError("Malformed response from server");
    }
    return "data" in data && Array.isArray(data.data) ? data.data : [];
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
    const data = await authorizedJson(
      `${API_BASE_URL}/shifts/${shiftId}`,
      "/shifts/:shiftId",
    );
    if (!data || typeof data !== "object") {
      throw new ShiftApiError("Malformed response from server");
    }
    return "data" in data ? data.data : undefined;
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
    const data = await authorizedJson(
      `${API_BASE_URL}/hcp/dashboard`,
      "/hcp/dashboard",
    );
    if (!data || typeof data !== "object") {
      throw new ShiftApiError("Malformed response from server");
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
